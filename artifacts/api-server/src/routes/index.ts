import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketRouter from "./market";
import newsRouter from "./news";
import calendarRouter from "./calendar";
import aiRouter from "./ai";
import companiesRouter from "./companies";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketRouter);
router.use(newsRouter);
router.use(calendarRouter);
router.use(aiRouter);
router.use(companiesRouter);
router.use(adminRouter);

export default router;
