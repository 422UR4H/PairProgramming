import { Movie, Rental, User } from "@prisma/client";
import { buildMovieInput } from '../factories/movie.factory'
import { buildUserInput } from '../factories/users.factory'
import { notFoundError } from "errors/notfound-error";
import { RentalInput } from "protocols";
import rentalsRepository from "repositories/rentals-repository";
import moviesRepository from "repositories/movies-repository";
import usersRepository from "repositories/users-repository";
import rentalService from "../../src/services/rentals-service";


// beforeEach(() => {
//   jest.clearAllMocks();
// })

describe("Rentals Service Unit Tests", () => {
  it("should return rental", async () => {
    jest.spyOn(rentalsRepository, "getRentals").mockResolvedValueOnce([
      { id: 1, closed: false, date: new Date(), endDate: new Date(), userId: 1 },
      { id: 2, closed: false, date: new Date(), endDate: new Date(), userId: 1 }
    ]);

    const rentals = await rentalService.getRentals();
    expect(rentals).toHaveLength(2);
  });

  it("should return a specific rental", async () => {
    const newRental: Rental & { movies: Movie[] } = {
      id: 1,
      closed: false,
      date: new Date(),
      endDate: new Date(),
      userId: 1,
      movies: [
        {
          id: 1,
          adultsOnly: true,
          name: "Something",
          rentalId: 1
        }
      ]
    }
    jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValueOnce(newRental);
    const rental = await rentalService.getRentalById(1);
    expect(rental).toEqual(newRental)
  });

  it("should return status 404 when trying to get a specific rental that doesnt exists", async () => {
    jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValueOnce(null);
    const result = rentalService.getRentalById(79);
    expect(result).rejects.toEqual(notFoundError("Rental not found."));
  });
});

describe("Create Rental", () => {

  it("should return status 404 if the movie is available", async () => {
    const user: User = { id: 1, ...buildUserInput(true) };
    let movie: Movie = { id: 2, adultsOnly: true, rentalId: 2, name: "Popzudas" };

    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(user);
    jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValueOnce([]);
    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce(movie);
    // jest.spyOn(moviesRepository, "getById").mockImplementation((): any => {
    //   return movie
    // });

    const rentalInput: RentalInput = {
      userId: user.id,
      moviesId: [movie.id]
    }

    const result = rentalService.createRental(rentalInput);
    expect(result).rejects.toEqual({
      name: "MovieInRentalError",
      message: "Movie already in a rental."
    });
  });
  it("should return status 500 if the user is not adult and is asking for an adult movie", async () => {
    const user: User = { id: 2, ...buildUserInput(false) };
    let movie: Movie = { id: 2, adultsOnly: true, rentalId: null, name: "Popzudas" };

    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(user);
    jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValueOnce([]);
    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce(movie);

    const rental: RentalInput = {
      userId: user.id,
      moviesId: [movie.id, 3, 4, 2]
    }

    const result = rentalService.createRental(rental);
    expect(result).rejects.toEqual({
      name: "InsufficientAgeError",
      message: "Cannot see that movie."
    });
  });

  it("should return status 404 if the user asked for more than 4 movies", async () => {
    const user: User = { id: 5, ...buildUserInput(true) };
    const movie: Movie = { id: 5, ...buildMovieInput() };

    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(user);
    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce(movie);

    const rental: RentalInput = {
      userId: user.id,
      moviesId: [movie.id, 4, 5, 6, 7]
    }

    const result = rentalService.createRental(rental);
    expect(result).rejects.toEqual({
      name: "NotFoundError",
      message: "Cannot rent 0 or more than 4 movies"
    });
  });

  it("should throw an error when movie is not available", async () => {
    const mockUser: User = { id: 1, ...buildUserInput(true) }
    const mockMovie: Movie = { id: 1, rentalId: 2, ...buildMovieInput(true) }

    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(mockUser)
    jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValueOnce([])
    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce(mockMovie)

    const rentalInput: RentalInput = {
      userId: mockUser.id,
      moviesId: [mockMovie.id]
    }

    const promise = rentalService.createRental(rentalInput)
    expect(promise).rejects.toEqual({
      name: "MovieInRentalError",
      message: "Movie already in a rental."
    });
  });


  it("should throw an error when trying to create a rental with pending location", async () => {
    const rentalInput: RentalInput = {
      moviesId: [1, 2],
      userId: 1
    };
    const rental: Rental = {
      closed: false,
      date: new Date(),
      endDate: new Date(),
      id: 1,
      userId: 1
    };
    const user: User = { id: 1, ...buildUserInput(true) };

    jest.spyOn(rentalsRepository, "createRental").mockResolvedValueOnce(rental);
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(user);

    const result = rentalService.createRental(rentalInput);
    expect(result).rejects.toEqual({
      name: "PendentRentalError",
      message: "The user already have a rental!"
    });
  });

  it("should throw an error when trying to rental with two some films", async () => {
    const user: User = { id: 1, ...buildUserInput(false) };
    const movie: Movie = { id: 1, adultsOnly: false, rentalId: 1, name: "aoipsdjfaio" };

    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(user);
    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce(movie);

    const rental: RentalInput = {
      userId: user.id,
      moviesId: [1, 1, 1]
    }
    const result = rentalService.createRental(rental);
    expect(result).rejects.toEqual({
      name: "NotFoundError",
      message: "Movie not found."
    });
  });
});

