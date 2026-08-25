"""
Cliente HTTP para la API de Wompi.

Centraliza:
  - Construcción de URLs (sandbox vs prod según public_key).
  - Tipado de errores (WompiError) con error.type/status/messages.
  - Retry con backoff exponencial + jitter para errores transitorios (5xx, 429).
  - Logging estructurado (URL, status, duración, reference) para alertas.

NO se importa nada de Django aquí: este módulo es puro Python y se
puede probar de forma aislada.
"""

import json
import logging
import random
import time
import urllib.error
import urllib.request


logger = logging.getLogger(__name__)


# Códigos HTTP transitorios que justifican un retry.
_RETRYABLE_STATUS = {408, 425, 429, 500, 502, 503, 504}


class WompiError(Exception):
    """Error tipado de Wompi. Permite decisiones según tipo/status."""

    def __init__(self, error_type, status, messages=None, raw=None):
        super().__init__(error_type)
        self.type = error_type or "UNKNOWN_ERROR"
        self.status = int(status) if status else 0
        self.messages = messages or {}
        self.raw = raw or {}

    @property
    def is_validation_error(self):
        return self.status == 422

    @property
    def is_duplicate_reference(self):
        return (
            self.status == 422
            and "has already been taken" in str(
                self.messages.get("reference", [])
            )
        )

    @property
    def is_auth_error(self):
        return self.status == 401

    @property
    def is_not_found(self):
        return self.status == 404

    @property
    def is_rate_limited(self):
        return self.status == 429

    @property
    def is_server_error(self):
        return 500 <= self.status < 600

    @property
    def is_retryable(self):
        return self.status in _RETRYABLE_STATUS

    def __str__(self):
        if self.messages:
            return f"{self.type} (HTTP {self.status}): {self.messages}"
        return f"{self.type} (HTTP {self.status})"


def base_url_for(public_key):
    """Devuelve sandbox o production según prefijo de la public_key."""
    pk = (public_key or "").strip()
    if pk.startswith("pub_test_"):
        return "https://sandbox.wompi.co/v1"
    return "https://production.wompi.co/v1"


def _parse_error_body(body_text):
    """
    Wompi devuelve errores así:
      { "error": { "type": "...", "messages": {...} } }
    Esta función es tolerante a respuestas malformadas.
    """
    if not body_text:
        return None, {}
    try:
        parsed = json.loads(body_text)
    except json.JSONDecodeError:
        return None, {}
    if not isinstance(parsed, dict):
        return None, {}
    err = parsed.get("error") or {}
    return err.get("type"), err.get("messages") or {}


def wompi_request(
    method,
    url,
    *,
    headers=None,
    data=None,
    timeout=30,
    context=None,
):
    """
    Ejecuta una request HTTP a Wompi y devuelve el JSON parseado.

    Lanza WompiError si la respuesta no es 2xx. Loguea método, URL,
    status y duración para que el log aggregator pueda alertar.

    `context` es un dict opcional (ej. {"reference": "VENTASYA-..."})
    que se incluye en cada línea de log.
    """
    ctx = context or {}
    headers = headers or {}
    body_bytes = None
    if data is not None:
        body_bytes = json.dumps(data).encode("utf-8")
        headers.setdefault("Content-Type", "application/json")

    req = urllib.request.Request(
        url, data=body_bytes, method=method, headers=headers
    )

    started = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read()
            status_code = response.status
            text = raw.decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        status_code = e.code
        text = e.read().decode("utf-8", errors="ignore")
    except Exception as e:
        duration_ms = int((time.monotonic() - started) * 1000)
        logger.error(
            "wompi_request_error",
            extra={
                "method": method,
                "url": url,
                "error": str(e),
                "duration_ms": duration_ms,
                **ctx,
            },
        )
        raise WompiError(
            "NETWORK_ERROR", 0, messages={"detail": str(e)}
        ) from e

    duration_ms = int((time.monotonic() - started) * 1000)

    if not (200 <= status_code < 300):
        err_type, messages = _parse_error_body(text)
        logger.warning(
            "wompi_request_failed",
            extra={
                "method": method,
                "url": url,
                "status": status_code,
                "error_type": err_type,
                "duration_ms": duration_ms,
                **ctx,
            },
        )
        raise WompiError(
            err_type, status_code, messages=messages, raw={"body": text}
        )

    logger.info(
        "wompi_request_success",
        extra={
            "method": method,
            "url": url,
            "status": status_code,
            "duration_ms": duration_ms,
            **ctx,
        },
    )

    if not text:
        return {}
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"raw": text}


def wompi_request_with_retry(
    method,
    url,
    *,
    headers=None,
    data=None,
    timeout=30,
    max_retries=3,
    base_delay_s=1.0,
    context=None,
):
    """
    Igual que wompi_request pero reintenta errores transitorios (5xx, 429,
    errores de red) con backoff exponencial + jitter.

    NO reintenta 4xx: hay que arreglar la request primero.
    """
    last_error = None

    for attempt in range(max_retries + 1):
        try:
            return wompi_request(
                method,
                url,
                headers=headers,
                data=data,
                timeout=timeout,
                context=context,
            )
        except WompiError as e:
            last_error = e
            if not e.is_retryable:
                raise
            if attempt >= max_retries:
                break
            delay = base_delay_s * (2 ** attempt) + random.uniform(0, 0.2)
            logger.info(
                "wompi_request_retry",
                extra={
                    "method": method,
                    "url": url,
                    "attempt": attempt + 1,
                    "status": e.status,
                    "error_type": e.type,
                    "delay_s": round(delay, 2),
                    **(context or {}),
                },
            )
            time.sleep(delay)

    # Si agotamos los reintentos, propagamos el último error.
    raise last_error
