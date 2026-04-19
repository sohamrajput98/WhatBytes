"""URL routes for healthcare API endpoints."""
from django.urls import path

from .views import (
    DoctorDetailView,
    DoctorListCreateView,
    LoginView,
    MeView,
    PatientDetailView,
    PatientDoctorMappingListCreateView,
    PatientListCreateView,
    PatientMappingsOrDeleteMappingView,
    RefreshAccessTokenView,
    RegisterView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", RefreshAccessTokenView.as_view(), name="auth-refresh"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("patients/", PatientListCreateView.as_view(), name="patients-list-create"),
    path("patients/<int:patient_id>/", PatientDetailView.as_view(), name="patients-detail"),
    path("doctors/", DoctorListCreateView.as_view(), name="doctors-list-create"),
    path("doctors/<int:doctor_id>/", DoctorDetailView.as_view(), name="doctors-detail"),
    path("mappings/", PatientDoctorMappingListCreateView.as_view(), name="mappings-list-create"),
    path("mappings/<int:identifier>/", PatientMappingsOrDeleteMappingView.as_view(), name="mappings-patient-or-delete"),
]
