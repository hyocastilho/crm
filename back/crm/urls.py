from django.urls import path

from . import views

urlpatterns = [
    path("health", views.health),
    path("auth/login", views.login_view),
    path("auth/logout", views.logout_view),
    path("auth/me", views.me),
    path("conversations", views.conversations),
    path("conversations/<uuid:conversation_id>", views.conversation_detail),
    path("conversations/<uuid:conversation_id>/messages", views.conversation_message),
    path("contacts", views.contacts),
    path("contacts/<uuid:contact_id>", views.contact_detail),
    path("pipeline", views.pipeline),
    path("webhooks/meta", views.meta_webhook),
]
