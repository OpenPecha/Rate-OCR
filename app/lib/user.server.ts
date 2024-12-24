import { db } from "~/services/db.server";

export const createUserIfNotExists = async (email: string) => {
  let user;
  user = await db.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!user) {
    user = await db.user.create({
      data: {
        username: email.split("@")[0],
        email: email,
      },
    });
  }
  return user;
};
