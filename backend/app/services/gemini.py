"""Gemini Pro integration for transcription processing and weekly digests.

When ``GEMINI_API_KEY`` is empty the functions return deterministic mock data
so that the application remains fully usable during local development without
a live API key.
"""

import json
import re
from datetime import date

import google.generativeai as genai

from app.config import settings

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _clean_json_response(text: str) -> str:
    """Strip markdown code fences that Gemini sometimes wraps around JSON.

    Args:
        text: Raw text returned by the model.

    Returns:
        A string that should be parseable by ``json.loads``.
    """
    text = text.strip()
    text = re.sub(r"^```(?:json)?\n?", "", text)
    text = re.sub(r"\n?```$", "", text)
    return text.strip()


def _get_model() -> genai.GenerativeModel:
    """Configure the Gemini client and return a model instance.

    Returns:
        A configured ``GenerativeModel`` instance.
    """
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel("gemini-3.1-flash-lite-preview")


# ---------------------------------------------------------------------------
# Mock responses (used when GEMINI_API_KEY is not set)
# ---------------------------------------------------------------------------

_MOCK_TRANSCRIPTION_RESULT: dict = {
    "key_points": [
        "El cliente mostró interés en ampliar el contrato actual.",
        "Se discutió la posibilidad de incluir nuevos productos en el portafolio.",
        "La próxima revisión de precios está programada para el siguiente trimestre.",
    ],
    "action_items": [
        {
            "description": "Enviar propuesta actualizada de contrato al cliente",
            "responsible": "KAM",
            "mine": True,
            "due_date": None,
        },
        {
            "description": "Coordinar visita técnica con el equipo de producto",
            "responsible": "KAM",
            "mine": True,
            "due_date": None,
        },
        {
            "description": "Revisar datos del informe trimestral",
            "responsible": "Otro participante",
            "mine": False,
            "due_date": None,
        },
    ],
    "recommendations": [
        "Preparar un análisis de ROI para presentar en la próxima reunión.",
        "Agendar revisión trimestral con el sponsor ejecutivo del cliente.",
    ],
    "reminders": [
        "Confirmar asistencia del cliente a la feria sectorial de abril.",
    ],
    "client_context": (
        "Cliente con alto potencial de crecimiento. Interesado en soluciones "
        "integradas. Decisor principal es el Director de Operaciones."
    ),
}

_MOCK_CLIENT_SUMMARY: str = (
    "## Resumen Global — Cliente Demo\n\n"
    "**Reuniones analizadas:** 1 | **Tareas:** 2 total, 0 completadas (0%)\n\n"
    "### Contexto general\n"
    "Cliente con alto potencial de crecimiento. Principal interés: ampliar contrato "
    "y evaluar nuevos productos. Decisor principal es el Director de Operaciones.\n\n"
    "### Tendencias y patrones\n"
    "- Interés recurrente en análisis de ROI (mencionado en la reunión inicial).\n"
    "- Pendiente de revisión de precios para el próximo trimestre.\n\n"
    "### Compromisos completados\n"
    "- Aún no hay tareas completadas. Buen momento para avanzar en los pendientes.\n\n"
    "### Pendientes prioritarios\n"
    "1. Enviar propuesta actualizada de contrato al cliente\n"
    "2. Coordinar visita técnica con el equipo de producto\n\n"
    "### Recomendaciones acumuladas\n"
    "- Preparar análisis de ROI para la próxima reunión.\n"
    "- Agendar revisión trimestral con el sponsor ejecutivo.\n\n"
    "### Próximos pasos sugeridos\n"
    "1. Enviar propuesta esta semana para mantener el momentum.\n"
    "2. Confirmar fecha de visita técnica.\n"
    "3. Preparar agenda para reunión de seguimiento Q2.\n"
)

_MOCK_WEEKLY_TASKS: list[dict] = [
    {"task": "Enviar propuesta comercial actualizada a los 3 clientes prioritarios.", "responsible": "KAM"},
    {"task": "Agendar llamadas de seguimiento con clientes que tienen contratos por vencer.", "responsible": "KAM"},
    {"task": "Actualizar el CRM con los compromisos adquiridos en reuniones de la semana.", "responsible": "KAM"},
    {"task": "Preparar presentación de nuevos productos para la reunión del viernes.", "responsible": "Equipo de producto"},
    {"task": "Revisar y responder correos pendientes de clientes estratégicos.", "responsible": "KAM"},
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def process_transcription(transcription_text: str, user_name: str = "") -> dict:
    """Extract structured insights from a meeting transcription using Gemini Pro.

    Returns mock data when ``GEMINI_API_KEY`` is not configured so that
    development and testing work without a live key.

    Args:
        transcription_text: The full text of the meeting transcription.
        user_name: Display name of the KAM who owns this meeting. Used to
            determine which action items are assigned to her (``mine: true``)
            vs. assigned to other participants (``mine: false``). When empty,
            all action items are marked ``mine: true``.

    Returns:
        A dict with keys ``key_points``, ``action_items``, ``recommendations``,
        ``reminders``, and ``client_context``.

    Raises:
        json.JSONDecodeError: If the model returns non-parseable JSON.
        google.api_core.exceptions.GoogleAPIError: On API failures.
    """
    if not settings.gemini_api_key:
        return _MOCK_TRANSCRIPTION_RESULT

    model = _get_model()

    user_context = (
        f'La persona que sube esta transcripción se llama "{user_name}". '
        "Marca como \"mine\": true SOLO los action items asignados a esa persona. "
        "Los action items de otros participantes deben tener \"mine\": false."
        if user_name
        else 'Marca todos los action items con "mine": true.'
    )

    prompt = f"""Analiza esta transcripción de reunión de ventas y extrae información estructurada.

{user_context}

Transcripción:
{transcription_text}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{{
  "key_points": ["punto 1", "punto 2", "punto 3"],
  "action_items": [
    {{
      "description": "tarea concreta (redactada en primera persona si es propia)",
      "responsible": "nombre exacto del responsable según la transcripción",
      "mine": true,
      "due_date": "YYYY-MM-DD o null"
    }}
  ],
  "recommendations": ["recomendación 1", "recomendación 2"],
  "reminders": ["recordatorio 1", "recordatorio 2"],
  "client_context": "resumen del contexto del cliente relevante para la base de conocimientos"
}}

IMPORTANTE: Incluye TODOS los action items en el JSON (propios y de otros participantes),
pero usa el campo "mine" para diferenciarlos.
No incluyas markdown, solo el JSON."""

    response = model.generate_content(prompt)
    cleaned = _clean_json_response(response.text)
    return json.loads(cleaned)


def generate_client_summary(client_data: dict) -> str:
    """Generate a living global summary for a client from all their historical data.

    The summary synthesises every meeting, insight, and task into a structured
    Markdown document that grows over time as new meetings are processed.

    Args:
        client_data: Dict with keys ``client_name``, ``total_meetings``,
            ``meetings`` (list of dicts with title/date/insights),
            ``tasks`` (list of dicts with description/status/due_date/from_meeting),
            and ``task_stats`` (total/done/pending/completion_pct).

    Returns:
        A Markdown-formatted summary string in Spanish.
    """
    if not settings.gemini_api_key:
        return _MOCK_CLIENT_SUMMARY

    model = _get_model()

    # Build meeting sections — truncate each insight to 500 chars to stay within token budget
    type_labels = {
        "key_point": "Punto clave",
        "action_item": "Acción",
        "recommendation": "Recomendación",
        "reminder": "Recordatorio",
        "client_context": "Contexto",
    }
    meetings_text = ""
    for m in client_data["meetings"]:
        meetings_text += f"\n### Reunión: {m['title']} ({m['date']})\n"
        for ins in m["insights"]:
            label = type_labels.get(ins["type"], ins["type"])
            content = ins["content"][:500]
            meetings_text += f"- [{label}] {content}\n"

    # Build tasks section
    stats = client_data["task_stats"]
    tasks_pending = [t for t in client_data["tasks"] if t["status"] == "pending"]
    tasks_done = [t for t in client_data["tasks"] if t["status"] == "done"]

    tasks_text = (
        f"Completadas: {stats['done']}/{stats['total']} "
        f"({stats['completion_pct']:.0f}%)\n\nPENDIENTES:\n"
    )
    for t in tasks_pending:
        src = f" [de: {t['from_meeting']}]" if t["from_meeting"] else ""
        due = f" — vence: {t['due_date']}" if t["due_date"] else ""
        tasks_text += f"- {t['description']}{src}{due}\n"
    tasks_text += "\nCOMPLETADAS:\n"
    for t in tasks_done:
        tasks_text += f"- {t['description']}\n"
    if not tasks_done:
        tasks_text += "- (ninguna completada aún)\n"

    prompt = f"""Eres un asistente experto para Key Account Managers.
Genera un resumen global actualizado del cliente "{client_data['client_name']}" basado en TODO el historial disponible: {client_data['total_meetings']} reunión(es) procesada(s).

## HISTORIAL DE REUNIONES E INSIGHTS
{meetings_text}

## ESTADO DE TAREAS
{tasks_text}

## INSTRUCCIONES
Escribe el resumen en español, en formato Markdown con estas 6 secciones exactas:

### Contexto general
(Quién es el cliente, qué quiere, perfil de la relación comercial)

### Tendencias y patrones
(Temas recurrentes entre reuniones — cita reuniones específicas por nombre y fecha)

### Compromisos completados
(Tareas ya resueltas — muestra el progreso real del equipo)

### Pendientes prioritarios
(Tareas sin completar ordenadas por urgencia, mencionando vencimientos si existen)

### Recomendaciones acumuladas
(Síntesis de todas las recomendaciones generadas en todas las reuniones)

### Próximos pasos sugeridos
(2-3 acciones concretas que la KAM debería priorizar esta semana)

Sé específico, menciona nombres de reuniones y fechas cuando sea relevante.
Destaca si hay tareas vencidas o patrones de incumplimiento.
Tono profesional y directo. Máximo 600 palabras."""

    response = model.generate_content(prompt)
    return response.text.strip()


def generate_weekly_digest(insights_summary: str) -> list[dict]:
    """Generate the top-5 priority tasks from a week's worth of insights.

    Returns mock tasks when ``GEMINI_API_KEY`` is not configured.

    Args:
        insights_summary: A plain-text concatenation of recent insights to
            feed to the model.

    Returns:
        A list of up to 5 dicts with keys ``task`` (description) and
        ``responsible`` (name of the person accountable).

    Raises:
        json.JSONDecodeError: If the model returns non-parseable JSON.
        google.api_core.exceptions.GoogleAPIError: On API failures.
    """
    if not settings.gemini_api_key:
        return _MOCK_WEEKLY_TASKS

    model = _get_model()

    prompt = f"""Basándote en estos insights de reuniones de la semana, genera las 5 tareas más prioritarias.
Para cada tarea, identifica quién es el responsable según la transcripción (usa el nombre exacto si aparece, o "KAM" si es la propia KAM).

Insights de la semana:
{insights_summary}

Responde ÚNICAMENTE con un JSON array con esta estructura exacta:
[
  {{"task": "descripción clara de la tarea", "responsible": "nombre del responsable"}},
  ...
]
No incluyas markdown, solo el JSON."""

    response = model.generate_content(prompt)
    cleaned = _clean_json_response(response.text)
    return json.loads(cleaned)
