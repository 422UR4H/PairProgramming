import { User, Movie, Rental } from "@prisma/client";

export type RentalInput = {
  userId: number,
  moviesId: number[]
}

export type RentalFinishInput = {
  rentalId: number;
}

export type UserInput = Omit<User, "id" | "rentals">;
export type MovieInput = Omit<Movie, "id">;
