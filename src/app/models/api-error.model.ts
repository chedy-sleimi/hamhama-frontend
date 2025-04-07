export interface ApiError {
    timestamp?: string; // Default Spring Boot error fields
    status?: number;
    error?: string;
    message?: string; // Often contains the useful info
    path?: string;
}