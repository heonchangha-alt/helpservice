import { Router, type IRouter } from "express";
import {
  CreatePortalRequestBody, CreatePortalRequestResponse, BatchPortalRequestsBody, GetPortalResponse,
  RatePortalRequestParams, RatePortalRequestBody, SavePortalCompaniesBody,
  ReadPortalNotificationsBody, ImportPortalRequestsBody,
} from "@workspace/api-zod";
import { getSnapshot } from "../repositories/portal";
import { createRequest, batchRequests, rateRequest, saveCompanies, readNotifications, importRequests } from "../services/portal";

const router: IRouter = Router();
router.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
router.get("/portal", async (_req, res): Promise<void> => { res.json(await getSnapshot()); });
router.post("/portal/requests", async (req, res): Promise<void> => {
  res.status(201).json(CreatePortalRequestResponse.parse(await createRequest(CreatePortalRequestBody.parse(req.body))));
});
router.post("/portal/batch", async (req, res): Promise<void> => {
  res.json(GetPortalResponse.parse(await batchRequests(BatchPortalRequestsBody.parse(req.body))));
});
router.post("/portal/requests/:id/rating", async (req, res): Promise<void> => {
  const { id } = RatePortalRequestParams.parse(req.params);
  res.json(GetPortalResponse.parse(await rateRequest(id, RatePortalRequestBody.parse(req.body))));
});
router.patch("/portal/companies", async (req, res): Promise<void> => {
  res.json(GetPortalResponse.parse(await saveCompanies(SavePortalCompaniesBody.parse(req.body))));
});
router.post("/portal/notifications/read", async (req, res): Promise<void> => {
  res.json(GetPortalResponse.parse(await readNotifications(ReadPortalNotificationsBody.parse(req.body).ids)));
});
router.post("/portal/import", async (req, res): Promise<void> => {
  res.json(GetPortalResponse.parse(await importRequests(ImportPortalRequestsBody.parse(req.body))));
});
export default router;
