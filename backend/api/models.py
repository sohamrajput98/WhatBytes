"""Database models for the healthcare backend."""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom manager for user model that uses email as username."""

    use_in_migrations = True

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        """Create and return a regular user with email as login identity."""
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra_fields):
        """Create and return a superuser."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom user model that authenticates via unique email."""

    username = None
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    objects = UserManager()

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"


class Patient(models.Model):
    """Patient model tied to the authenticated creator user."""

    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    ]

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="patients")
    name = models.CharField(max_length=255)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    contact_number = models.CharField(max_length=20)
    address = models.TextField()
    medical_history = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.id})"


class Doctor(models.Model):
    """Doctor model for provider directory and assignment."""

    name = models.CharField(max_length=255)
    specialization = models.CharField(max_length=255)
    experience_years = models.PositiveIntegerField()
    contact_number = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"Dr. {self.name} ({self.specialization})"


class PatientDoctorMapping(models.Model):
    """Mapping model representing assignment of a doctor to a patient."""

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="doctor_mappings")
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="patient_mappings")
    assigned_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-assigned_at"]
        constraints = [
            models.UniqueConstraint(fields=["patient", "doctor"], name="unique_patient_doctor_mapping")
        ]

    def __str__(self) -> str:
        return f"Patient {self.patient_id} -> Doctor {self.doctor_id}"
