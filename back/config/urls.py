from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "CRM"
admin.site.site_title = "CRM"
admin.site.index_title = "Operação"

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", include("crm.urls")),
]
