export enum ErrorCode {
    BAD_REQUEST = 'request.bad-request',
    VALIDATION_FAILED = 'request.validation-failed',
    INVALID_UUID = 'request.invalid-uuid',
    INVALID_DATE_FORMAT = 'request.invalid-date-format',
    INVALID_MONTH_FORMAT = 'request.invalid-month-format',
    INVALID_TIME_UNIT = 'request.invalid-time-unit',
    RESOURCE_NOT_FOUND = 'request.resource-not-found',

    ENVIRONMENT_VARIABLE_NOT_DEFINED = 'config.environment-variable-not-defined',
    INVALID_NODE_ENV = 'config.invalid-node-env',

    UNAUTHORIZED = 'auth.unauthorized',
    INVALID_CREDENTIALS = 'auth.invalid-credentials',
    INVALID_ACCESS_TOKEN = 'auth.invalid-access-token',
    INVALID_AUTHORIZATION_FORMAT = 'auth.invalid-authorization-format',
    AUTHORIZATION_HEADER_MISSING = 'auth.authorization-header-missing',
    USER_NOT_IN_REQUEST = 'auth.user-not-in-request',

    FORBIDDEN = 'authorization.forbidden',
    ROLE_PERMISSION_DENIED = 'authorization.role-permission-denied',

    USER_NOT_FOUND = 'user.user-not-found',
    USER_ALREADY_EXISTS_WITH_EMAIL = 'user.user-already-exists-with-email',
    USER_ALREADY_EXISTS_WITH_PHONE = 'user.user-already-exists-with-phone',
    USER_ALREADY_REGISTERED = 'user.user-already-registered',

    ATTENDANCE_NOT_FOUND = 'attendance.not-found',
    ATTENDANCE_ALREADY_EXISTS = 'attendance.already-exists',
    ATTENDANCE_CREATE_FAILED = 'attendance.create-failed',
    ATTENDANCE_UPDATE_FAILED = 'attendance.update-failed',
    ATTENDANCE_DELETE_FAILED = 'attendance.delete-failed',
    ATTENDANCE_EMPTY_UPDATE_PAYLOAD = 'attendance.empty-update-payload',
    ATTENDANCE_STUDENT_SCOPE_VIOLATION = 'attendance.student-scope-violation',

    REFRESH_TOKEN_SAVE_FAILED = 'refresh-token.save-failed',

    INTERNAL_SERVER_ERROR = 'server.internal-server-error',
}
