import { Request, Response } from "express";

import { GetProfileUseCase } from "../../../application/use-cases/users/get-profile/get-profile";

export class UsersController {
  constructor(private readonly getProfileUseCase: GetProfileUseCase) {}

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const profile = await this.getProfileUseCase.execute(req.user!.id);

    if (!profile) {
      res.status(404).json({
        message: "USER_NOT_FOUND",
      });

      return;
    }

    res.json(profile);
  };
}
