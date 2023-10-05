import { faker } from "@faker-js/faker";
import prisma from "database";
import { Movie } from "@prisma/client";


export async function createRental(userId: number, endDate: Date, closed: boolean, rentalMovies: Movie[]) {
    return await prisma.rental.create({
        data: {
            userId,
            date: new Date(),
            endDate,
            closed,
            movies: {
                createMany: {
                    data: rentalMovies
                }
            }
        }
    });
}

export async function createRandomRental(): Promise<Movie[]> {
    const movies = await prisma.movie.findMany({ where: { rentalId: null } });
    return faker.helpers.arrayElements(movies, faker.number.int({ min: 1, max: 5 }));
}