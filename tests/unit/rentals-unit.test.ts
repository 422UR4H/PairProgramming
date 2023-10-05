import { buildMovie } from "../factories/movie.factory";
import { buildUser } from "../factories/users.factory";
import { faker } from "@faker-js/faker";
import rentalService, { RENTAL_LIMITATIONS } from "../../src/services/rentals-service";
import rentalsRepository from "repositories/rentals-repository";
import { createRental } from "../factories/rental.factory";
import { Movie } from "@prisma/client";


describe("Rentals Service Unit Tests", () => {
  it("should return rental", async () => {
    const user = await buildUser(faker.datatype.boolean());
    const movies: Movie[] = [];
    for (let i = 0; i < 10; i++) {
      movies.push(await buildMovie(null, null, null));
    }

    const moviesId = movies.map(m => m.id);
    const date = new Date(new Date().getDate() + RENTAL_LIMITATIONS.RENTAL_DAYS_LIMIT);
    const rental = await createRental(user.id, date, false, movies);
    jest
      .spyOn(rentalsRepository, "createRental")
      .mockImplementationOnce((): any => {
        return rental;
      });

    const result = await rentalService.createRental({
      userId: user.id,
      moviesId
    });

    expect(result).toEqual({
      id: expect.any(Number),
      date: rental.date,
      endDate: rental.endDate,
      userId: user.id,
      closed: rental.closed
    });
  });
});
