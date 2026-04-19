"""API views for authentication, patient management, doctor management, and mappings."""
import logging

from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView, exception_handler as drf_exception_handler
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Doctor, Patient, PatientDoctorMapping
from .serializers import (
    DoctorSerializer,
    LoginSerializer,
    MappingDoctorSerializer,
    PatientDoctorMappingCreateSerializer,
    PatientDoctorMappingSerializer,
    PatientSerializer,
    RegisterSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


def success_response(data=None, message="Request successful.", status_code=status.HTTP_200_OK):
    """Return standardized success envelope response."""
    return Response(
        {
            "success": True,
            "data": data if data is not None else {},
            "message": message,
        },
        status=status_code,
    )


def error_response(error, details=None, status_code=status.HTTP_400_BAD_REQUEST):
    """Return standardized error envelope response."""
    return Response(
        {
            "success": False,
            "error": error,
            "details": details if details is not None else {},
        },
        status=status_code,
    )


def custom_exception_handler(exc, context):
    """Format all DRF exceptions into the required API error envelope."""
    response = drf_exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled exception in API view", exc_info=exc)
        return error_response(
            error="Internal server error.",
            details={},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    details = response.data
    error_message = "Request failed."

    if isinstance(details, dict):
        if "detail" in details:
            error_message = str(details["detail"])
        elif "non_field_errors" in details and details["non_field_errors"]:
            error_message = str(details["non_field_errors"][0])
        else:
            first_key = next(iter(details.keys()), None)
            if first_key:
                value = details[first_key]
                if isinstance(value, list) and value:
                    error_message = str(value[0])
                else:
                    error_message = str(value)
    elif isinstance(details, list) and details:
        error_message = str(details[0])

    return error_response(
        error=error_message,
        details=details,
        status_code=response.status_code,
    )


class RegisterView(APIView):
    """Register a new user and return profile with JWT access and refresh tokens."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Create user account and issue JWT tokens."""
        try:
            serializer = RegisterSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

            refresh = RefreshToken.for_user(user)
            payload = {
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            }
            return success_response(payload, "User registered successfully.", status.HTTP_201_CREATED)
        except ValidationError as exc:
            return error_response("Validation failed.", exc.detail, status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Register endpoint failed", exc_info=exc)
            return error_response("Could not register user.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    """Authenticate user and return profile with new JWT access and refresh tokens."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Validate credentials and issue JWT tokens."""
        try:
            serializer = LoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)
            payload = {
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            }
            return success_response(payload, "Login successful.")
        except ValidationError as exc:
            return error_response("Validation failed.", exc.detail, status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Login endpoint failed", exc_info=exc)
            return error_response("Could not log in user.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshAccessTokenView(APIView):
    """Refresh JWT access token from a valid refresh token."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Issue a new access token using refresh token payload."""
        try:
            serializer = TokenRefreshSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            return success_response({"access": serializer.validated_data["access"]}, "Access token refreshed.")
        except ValidationError as exc:
            return error_response("Invalid refresh token.", exc.detail, status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Token refresh endpoint failed", exc_info=exc)
            return error_response("Could not refresh token.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)


class MeView(APIView):
    """Return currently authenticated user profile details."""

    def get(self, request):
        """Return current user profile payload."""
        try:
            return success_response(UserSerializer(request.user).data, "User profile fetched successfully.")
        except Exception as exc:
            logger.exception("Me endpoint failed", exc_info=exc)
            return error_response("Could not fetch user profile.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatientListCreateView(APIView):
    """Create a patient for the authenticated user or list owned patients."""

    def get(self, request):
        """List all patients created by the authenticated user."""
        try:
            patients = Patient.objects.filter(created_by=request.user)
            data = PatientSerializer(patients, many=True).data
            return success_response(data, "Patients fetched successfully.")
        except Exception as exc:
            logger.exception("Patient list endpoint failed", exc_info=exc)
            return error_response("Could not fetch patients.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Create a new patient tied to the authenticated user."""
        try:
            serializer = PatientSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            patient = serializer.save(created_by=request.user)
            return success_response(PatientSerializer(patient).data, "Patient created successfully.", status.HTTP_201_CREATED)
        except ValidationError as exc:
            return error_response("Validation failed.", exc.detail, status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Patient create endpoint failed", exc_info=exc)
            return error_response("Could not create patient.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatientDetailView(APIView):
    """Retrieve, update, or delete a specific patient owned by authenticated user."""

    @staticmethod
    def _get_patient_or_404(user, patient_id):
        """Return patient object if owned by user, otherwise raise 404."""
        return get_object_or_404(Patient, id=patient_id, created_by=user)

    def get(self, request, patient_id):
        """Get one owned patient record."""
        try:
            patient = self._get_patient_or_404(request.user, patient_id)
            return success_response(PatientSerializer(patient).data, "Patient fetched successfully.")
        except Exception as exc:
            if hasattr(exc, "status_code") and exc.status_code == 404:
                return error_response("Patient not found.", {}, status.HTTP_404_NOT_FOUND)
            logger.exception("Patient detail endpoint failed", exc_info=exc)
            return error_response("Could not fetch patient.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, patient_id):
        """Update one owned patient record."""
        try:
            patient = self._get_patient_or_404(request.user, patient_id)
            serializer = PatientSerializer(patient, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return success_response(serializer.data, "Patient updated successfully.")
        except ValidationError as exc:
            return error_response("Validation failed.", exc.detail, status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            if hasattr(exc, "status_code") and exc.status_code == 404:
                return error_response("Patient not found.", {}, status.HTTP_404_NOT_FOUND)
            logger.exception("Patient update endpoint failed", exc_info=exc)
            return error_response("Could not update patient.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, patient_id):
        """Delete one owned patient record."""
        try:
            patient = self._get_patient_or_404(request.user, patient_id)
            patient.delete()
            return success_response({}, "Patient deleted successfully.")
        except Exception as exc:
            if hasattr(exc, "status_code") and exc.status_code == 404:
                return error_response("Patient not found.", {}, status.HTTP_404_NOT_FOUND)
            logger.exception("Patient delete endpoint failed", exc_info=exc)
            return error_response("Could not delete patient.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)


class DoctorListCreateView(APIView):
    """Create a doctor record or list all doctors."""

    def get(self, request):
        """List all doctors."""
        try:
            doctors = Doctor.objects.all()
            data = DoctorSerializer(doctors, many=True).data
            return success_response(data, "Doctors fetched successfully.")
        except Exception as exc:
            logger.exception("Doctor list endpoint failed", exc_info=exc)
            return error_response("Could not fetch doctors.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Create a doctor entry."""
        try:
            serializer = DoctorSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            doctor = serializer.save()
            return success_response(DoctorSerializer(doctor).data, "Doctor created successfully.", status.HTTP_201_CREATED)
        except ValidationError as exc:
            return error_response("Validation failed.", exc.detail, status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Doctor create endpoint failed", exc_info=exc)
            return error_response("Could not create doctor.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)


class DoctorDetailView(APIView):
    """Retrieve, update, or delete a specific doctor record."""

    @staticmethod
    def _get_doctor_or_404(doctor_id):
        """Return doctor object by id or raise 404."""
        return get_object_or_404(Doctor, id=doctor_id)

    def get(self, request, doctor_id):
        """Get one doctor by id."""
        try:
            doctor = self._get_doctor_or_404(doctor_id)
            return success_response(DoctorSerializer(doctor).data, "Doctor fetched successfully.")
        except Exception as exc:
            if hasattr(exc, "status_code") and exc.status_code == 404:
                return error_response("Doctor not found.", {}, status.HTTP_404_NOT_FOUND)
            logger.exception("Doctor detail endpoint failed", exc_info=exc)
            return error_response("Could not fetch doctor.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, doctor_id):
        """Update doctor details by id."""
        try:
            doctor = self._get_doctor_or_404(doctor_id)
            serializer = DoctorSerializer(doctor, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return success_response(serializer.data, "Doctor updated successfully.")
        except ValidationError as exc:
            return error_response("Validation failed.", exc.detail, status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            if hasattr(exc, "status_code") and exc.status_code == 404:
                return error_response("Doctor not found.", {}, status.HTTP_404_NOT_FOUND)
            logger.exception("Doctor update endpoint failed", exc_info=exc)
            return error_response("Could not update doctor.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, doctor_id):
        """Delete doctor by id."""
        try:
            doctor = self._get_doctor_or_404(doctor_id)
            doctor.delete()
            return success_response({}, "Doctor deleted successfully.")
        except Exception as exc:
            if hasattr(exc, "status_code") and exc.status_code == 404:
                return error_response("Doctor not found.", {}, status.HTTP_404_NOT_FOUND)
            logger.exception("Doctor delete endpoint failed", exc_info=exc)
            return error_response("Could not delete doctor.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatientDoctorMappingListCreateView(APIView):
    """Create mappings and list all mappings for patients owned by current user."""

    def get(self, request):
        """List all mappings with nested patient and doctor info."""
        try:
            mappings = PatientDoctorMapping.objects.select_related("patient", "doctor").filter(
                patient__created_by=request.user
            )
            data = PatientDoctorMappingSerializer(mappings, many=True).data
            return success_response(data, "Mappings fetched successfully.")
        except Exception as exc:
            logger.exception("Mapping list endpoint failed", exc_info=exc)
            return error_response("Could not fetch mappings.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Assign a doctor to an owned patient and prevent duplicate mappings."""
        try:
            serializer = PatientDoctorMappingCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            patient_id = serializer.validated_data["patient_id"]
            doctor_id = serializer.validated_data["doctor_id"]
            notes = serializer.validated_data.get("notes", "")

            patient = Patient.objects.filter(id=patient_id, created_by=request.user).first()
            if not patient:
                return error_response("Patient not found or access denied.", {}, status.HTTP_404_NOT_FOUND)

            doctor = Doctor.objects.filter(id=doctor_id).first()
            if not doctor:
                return error_response("Doctor not found.", {}, status.HTTP_404_NOT_FOUND)

            if PatientDoctorMapping.objects.filter(patient=patient, doctor=doctor).exists():
                return error_response(
                    "Mapping already exists for this patient and doctor.",
                    {},
                    status.HTTP_400_BAD_REQUEST,
                )

            mapping = PatientDoctorMapping.objects.create(patient=patient, doctor=doctor, notes=notes)
            data = PatientDoctorMappingSerializer(mapping).data
            return success_response(data, "Doctor assigned to patient successfully.", status.HTTP_201_CREATED)
        except ValidationError as exc:
            return error_response("Validation failed.", exc.detail, status.HTTP_400_BAD_REQUEST)
        except IntegrityError as exc:
            logger.exception("Duplicate mapping creation attempt", exc_info=exc)
            return error_response("Mapping already exists for this patient and doctor.", {}, status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Mapping create endpoint failed", exc_info=exc)
            return error_response("Could not assign doctor to patient.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatientMappingsOrDeleteMappingView(APIView):
    """Get mappings by patient id (GET) or delete mapping by mapping id (DELETE)."""

    def get(self, request, identifier):
        """Return all doctors assigned to a specific owned patient id."""
        try:
            patient = Patient.objects.filter(id=identifier, created_by=request.user).first()
            if not patient:
                return error_response("Patient not found or access denied.", {}, status.HTTP_404_NOT_FOUND)

            mappings = PatientDoctorMapping.objects.select_related("doctor").filter(patient=patient)
            data = {
                "patient_id": patient.id,
                "doctors": MappingDoctorSerializer(mappings, many=True).data,
            }
            return success_response(data, "Doctors assigned to patient fetched successfully.")
        except Exception as exc:
            logger.exception("Mappings by patient endpoint failed", exc_info=exc)
            return error_response("Could not fetch patient mappings.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, identifier):
        """Delete mapping record by mapping id, restricted to owned patients."""
        try:
            mapping = PatientDoctorMapping.objects.filter(
                id=identifier,
                patient__created_by=request.user,
            ).first()
            if not mapping:
                return error_response("Mapping not found or access denied.", {}, status.HTTP_404_NOT_FOUND)

            mapping.delete()
            return success_response({}, "Mapping deleted successfully.")
        except Exception as exc:
            logger.exception("Mapping delete endpoint failed", exc_info=exc)
            return error_response("Could not delete mapping.", {}, status.HTTP_500_INTERNAL_SERVER_ERROR)
