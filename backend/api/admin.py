"""Admin configuration for healthcare API models."""
from django.contrib import admin

from .models import Doctor, Patient, PatientDoctorMapping, User

admin.site.register(User)
admin.site.register(Patient)
admin.site.register(Doctor)
admin.site.register(PatientDoctorMapping)
