"""Serializers for healthcare backend API endpoints."""
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Doctor, Patient, PatientDoctorMapping

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile payloads."""

    class Meta:
        model = User
        fields = ("id", "name", "email")


class RegisterSerializer(serializers.Serializer):
    """Serializer to validate and create a new authenticated user."""

    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        """Ensure registration email is unique."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        """Create and return user from validated registration fields."""
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    """Serializer to validate user login input."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        """Validate user credentials and attach authenticated user."""
        email = attrs.get("email", "").lower()
        password = attrs.get("password")

        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("User account is inactive.")

        attrs["user"] = user
        return attrs


class PatientSerializer(serializers.ModelSerializer):
    """Serializer for patient create/read/update payloads."""

    class Meta:
        model = Patient
        fields = (
            "id",
            "created_by",
            "name",
            "age",
            "gender",
            "contact_number",
            "address",
            "medical_history",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")


class DoctorSerializer(serializers.ModelSerializer):
    """Serializer for doctor create/read/update payloads."""

    class Meta:
        model = Doctor
        fields = (
            "id",
            "name",
            "specialization",
            "experience_years",
            "contact_number",
            "email",
            "available",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class PatientDoctorMappingCreateSerializer(serializers.Serializer):
    """Serializer for doctor assignment request payload."""

    patient_id = serializers.IntegerField(min_value=1)
    doctor_id = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class PatientDoctorMappingSerializer(serializers.ModelSerializer):
    """Serializer for mapping output with nested patient and doctor details."""

    patient = PatientSerializer(read_only=True)
    doctor = DoctorSerializer(read_only=True)

    class Meta:
        model = PatientDoctorMapping
        fields = ("id", "patient", "doctor", "assigned_at", "notes")


class MappingDoctorSerializer(serializers.ModelSerializer):
    """Serializer for doctor list returned for a specific patient mapping query."""

    mapping_id = serializers.IntegerField(source="id", read_only=True)
    doctor = DoctorSerializer(read_only=True)

    class Meta:
        model = PatientDoctorMapping
        fields = ("mapping_id", "doctor", "assigned_at", "notes")
