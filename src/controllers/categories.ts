import {Response, Request} from 'express';

export const getCategories = (_req: Request, res: Response) => {
    res.status(200).json({
        message: 'Categories retrieved successfully',
    });
}

export const getCategoryById = (req: Request, res: Response) => {
    const { id } = req.params;
    res.status(200).json({
        message: `Category with ID ${id} retrieved successfully`,
    });
}