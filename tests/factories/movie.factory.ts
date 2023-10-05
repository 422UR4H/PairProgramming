import { MovieInput } from "protocols";
import { faker } from "@faker-js/faker";
import prisma from "database";


export function buildMovie(adult: boolean | null, name: string | null, rentalId: number | null, randomize: boolean = true) {
    const data: MovieInput = buildMovieInput(adult, name, rentalId, randomize);
    return prisma.movie.create({ data });
}

export function buildMovieInput(
    adult: boolean | null = true,
    name: string | null = "Interstellar",
    rentalId: number | null = 1,
    randomize = true
): MovieInput {
    return {
        name: randomize ? faker.person.fullName() : name,
        adultsOnly: randomize ? faker.datatype.boolean() : adult,
        rentalId: randomize ? null : rentalId
    };
}
