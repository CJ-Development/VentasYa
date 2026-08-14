"""
Rutas del proyecto VentasYa.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/users/", include("apps.users.urls")),
    path("api/categories/", include("apps.categories.urls")),
    path("api/products/", include("apps.products.urls")),
    path("api/offers/", include("apps.offers.urls")),
    path("api/favorites/", include("apps.favorites.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/cart/", include("apps.cart.urls")),
    path("api/payments/", include("apps.payments.urls")),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

# Servir archivos subidos (imágenes de productos) en desarrollo.
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
