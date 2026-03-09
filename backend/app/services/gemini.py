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
    return genai.GenerativeModel("gemini-pro")


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
            "due_date": None,
        },
        {
            "description": "Coordinar visita técnica con el equipo de producto",
            "responsible": "KAM",
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

_MOCK_WEEKLY_TASKS: list[str] = [
    "Enviar propuesta comercial actualizada a los 3 clientes prioritarios.",
    "Agendar llamadas de seguimiento con clientes que tienen contratos por vencer.",
    "Actualizar el CRM con los compromisos adquiridos en reuniones de la semana.",
    "Preparar presentación de nuevos productos para la reunión del viernes.",
    "Revisar y responder correos pendientes de clientes estratégicos.",
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def process_transcription(transcription_text: str) -> dict:
    """Extract structured insights from a meeting transcription using Gemini Pro.

    Returns mock data when ``GEMINI_API_KEY`` is not configured so that
    development and testing work without a live key.

    Args:
        transcription_text: The full text of the meeting transcription.

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

    prompt = f"""Analiza esta transcripción de reunión de ventas y extrae información estructurada.

Transcripción:
{transcription_text}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{{
  "key_points": ["punto 1", "punto 2", "punto 3"],
  "action_items": [
    {{"description": "tarea concreta", "responsible": "nombre o KAM", "due_date": "YYYY-MM-DD o null"}}
  ],
  "recommendations": ["recomendación 1", "recomendación 2"],
  "reminders": ["recordatorio 1", "recordatorio 2"],
  "client_context": "resumen del contexto del cliente relevante para la base de conocimientos"
}}

No incluyas markdown, solo el JSON."""

    response = model.generate_content(prompt)
    cleaned = _clean_json_response(response.text)
    return json.loads(cleaned)


def generate_weekly_digest(insights_summary: str) -> list[str]:
    """Generate the top-5 priority tasks from a week's worth of insights.

    Returns mock tasks when ``GEMINI_API_KEY`` is not configured.

    Args:
        insights_summary: A plain-text concatenation of recent insights to
            feed to the model.

    Returns:
        A list of up to 5 priority task strings.

    Raises:
        json.JSONDecodeError: If the model returns non-parseable JSON.
        google.api_core.exceptions.GoogleAPIError: On API failures.
    """
    if not settings.gemini_api_key:
        return _MOCK_WEEKLY_TASKS

    model = _get_model()

    prompt = f"""Basándote en estos insights de reuniones de la semana, genera las 5 tareas más prioritarias para esta KAM.

Insights de la semana:
{insights_summary}

Responde ÚNICAMENTE con un JSON array de strings con las 5 tareas prioritarias.
Ejemplo: ["Tarea 1", "Tarea 2", ...]"""

    response = model.generate_content(prompt)
    cleaned = _clean_json_response(response.text)
    return json.loads(cleaned)
