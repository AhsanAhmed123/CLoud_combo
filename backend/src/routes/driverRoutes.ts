import { Router } from "express";
import {
  getDriveFiles,
  getFolderFiles,
  startNewTransfer,
  getDriveRootFolders,
  getChildrenOfFolder,
  getDropboxUrl,
  dropboxAuthentication, getDropboxFileThumbnails
} from "../controllers/drivesController";

const router = Router();

router.post("/transfer/new", startNewTransfer);
router.get("/files", getDriveFiles);
router.get("/root-folders", getDriveRootFolders);
router.get("/folder-children", getChildrenOfFolder);
router.get("/folder/files", getFolderFiles);
// router.get("/folder-tree", getDriveFolderTree);
// router.get("/file-tree", getDriveFileTree);
router.get("/dropbox-url", getDropboxUrl);
router.post("/auth/dropbox", dropboxAuthentication);
router.post("/dropbox-thumbnails", getDropboxFileThumbnails);

export default router;
