"""Custom permissions for healthcare backend resources."""
from rest_framework.permissions import BasePermission


class IsPatientOwner(BasePermission):
    """Permission that allows access only to the user who created the patient."""

    def has_object_permission(self, request, view, obj):
        """Return True only if object creator matches requesting user."""
        return getattr(obj, "created_by", None) == request.user
