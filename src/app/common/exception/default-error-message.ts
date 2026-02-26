import { ErrorCode } from "./error-code";
import { APIResponse } from "../helper/response";

export const defaultErrorMessages: Record<
    ErrorCode,
    Pick<APIResponse, 'message' | 'statusCode'>
> = {
    [ErrorCode.BAD_REQUEST]: {
        message: 'Bad request',
        statusCode: 400,
    },
    [ErrorCode.VALIDATION_FAILED]: {
        message: 'Validation failed',
        statusCode: 400,
    },
    [ErrorCode.INVALID_UUID]: {
        message: 'Invalid UUID format',
        statusCode: 400,
    },
    [ErrorCode.INVALID_DATE_FORMAT]: {
        message: 'Invalid date format',
        statusCode: 400,
    },
    [ErrorCode.INVALID_MONTH_FORMAT]: {
        message: 'Invalid month format',
        statusCode: 400,
    },
    [ErrorCode.INVALID_TIME_UNIT]: {
        message: 'Invalid time unit',
        statusCode: 400,
    },
    [ErrorCode.RESOURCE_NOT_FOUND]: {
        message: 'Resource not found',
        statusCode: 404,
    },
    [ErrorCode.ENVIRONMENT_VARIABLE_NOT_DEFINED]: {
        message: 'Environment variable is not defined',
        statusCode: 500,
    },
    [ErrorCode.INVALID_NODE_ENV]: {
        message: 'Invalid NODE_ENV value',
        statusCode: 500,
    },
    [ErrorCode.UNAUTHORIZED]: {
        message: 'Unauthorized',
        statusCode: 401,
    },
    [ErrorCode.INVALID_CREDENTIALS]: {
        message: 'Invalid credentials',
        statusCode: 401,
    },
    [ErrorCode.INVALID_ACCESS_TOKEN]: {
        message: 'Invalid access token',
        statusCode: 401,
    },
    [ErrorCode.INVALID_AUTHORIZATION_FORMAT]: {
        message: 'Invalid authorization format',
        statusCode: 401,
    },
    [ErrorCode.AUTHORIZATION_HEADER_MISSING]: {
        message: 'You must be loggedIn!',
        statusCode: 401,
    },
    [ErrorCode.USER_NOT_IN_REQUEST]: {
        message: 'User not found in request',
        statusCode: 401,
    },
    [ErrorCode.FORBIDDEN]: {
        message: 'Forbidden',
        statusCode: 403,
    },
    [ErrorCode.ROLE_PERMISSION_DENIED]: {
        message: 'You are not authorized to perform this action!',
        statusCode: 403,
    },
    [ErrorCode.USER_NOT_FOUND]: {
        message: 'User not found',
        statusCode: 404,
    },
    [ErrorCode.USER_ALREADY_EXISTS_WITH_EMAIL]: {
        message: 'User already exists with this email',
        statusCode: 409,
    },
    [ErrorCode.USER_ALREADY_EXISTS_WITH_PHONE]: {
        message: 'User already exists with this phone number',
        statusCode: 409,
    },
    [ErrorCode.USER_ALREADY_REGISTERED]: {
        message: 'User already registered',
        statusCode: 409,
    },
    [ErrorCode.ATTENDANCE_NOT_FOUND]: {
        message: 'Attendance not found',
        statusCode: 404,
    },
    [ErrorCode.ATTENDANCE_ALREADY_EXISTS]: {
        message: 'Attendance already exists',
        statusCode: 409,
    },
    [ErrorCode.ATTENDANCE_CREATE_FAILED]: {
        message: 'Failed to create attendance',
        statusCode: 500,
    },
    [ErrorCode.ATTENDANCE_UPDATE_FAILED]: {
        message: 'Failed to update attendance',
        statusCode: 500,
    },
    [ErrorCode.ATTENDANCE_DELETE_FAILED]: {
        message: 'Failed to delete attendance',
        statusCode: 500,
    },
    [ErrorCode.ATTENDANCE_EMPTY_UPDATE_PAYLOAD]: {
        message: 'At least one field is required to update attendance',
        statusCode: 400,
    },
    [ErrorCode.ATTENDANCE_STUDENT_SCOPE_VIOLATION]: {
        message: 'Students can only view their own attendance',
        statusCode: 403,
    },
    [ErrorCode.REFRESH_TOKEN_SAVE_FAILED]: {
        message: 'Failed to save refresh token',
        statusCode: 500,
    },
    [ErrorCode.INTERNAL_SERVER_ERROR]: {
        message: 'Internal server error',
        statusCode: 500,
    },
};
