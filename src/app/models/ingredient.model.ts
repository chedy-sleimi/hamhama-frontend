export interface Ingredient {
    id: number;
    name: string;
}

export interface Substitute {
    name: string;
    reason: string;
}

export interface SubstituteDTO {
    original: string;
    substitutes: Substitute[];
}