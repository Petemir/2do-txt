import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { CloudStorage, useCloudStorage } from "../data/CloudStorageContext";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useFileCreateDialog } from "../data/FileCreateDialogContext";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { getFilesystem } from "../utils/filesystem";
import { getPlatform } from "../utils/platform";

const defaultTodoFilePath = import.meta.env.VITE_DEFAULT_FILE_NAME!;

const FileCreateDialog = () => {
  const { t } = useTranslation();
  const { isFile, getUniqueFilePath } = getFilesystem();
  const { addTodoFilePath } = useSettings();
  const [fileName, setFileName] = useState("");
  const platform = getPlatform();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { setActiveTaskListPath } = useFilter();
  const { uploadFile, cloudStorageClients } = useCloudStorage();
  const { saveTodoFile } = useTask();
  const {
    fileCreateDialog: { open, createExampleFile, createFirstTask },
    setFileCreateDialog,
  } = useFileCreateDialog();
  const { setTaskDialogOptions } = useTaskDialog();
  const [selectedCloudStorage, setSelectedCloudStorage] = useState<
    CloudStorage | undefined
  >("Dropbox");

  const createNewFile = useCallback(
    async (filePath: string) => {
      if (!filePath) {
        return;
      }

      let text = "";
      if (createExampleFile) {
        text = await fetch("/todo.txt").then((r) => r.text());
      }

      await saveTodoFile(filePath, text);
      await addTodoFilePath(filePath);
      setActiveTaskListPath(filePath);
      if (createFirstTask) {
        setTaskDialogOptions({ open: true });
      }
    },
    [
      createExampleFile,
      saveTodoFile,
      addTodoFilePath,
      setActiveTaskListPath,
      createFirstTask,
      setTaskDialogOptions,
    ]
  );

  const createTodoFileAndSync = async () => {
    handleClose();
    await createNewFile(fileName);
    if (
      selectedCloudStorage &&
      cloudStorageClients[selectedCloudStorage].status === "connected"
    ) {
      await uploadFile({
        filePath: fileName,
        text: "",
        cloudStorage: selectedCloudStorage,
        archive: false,
      });
    }
  };

  const handleSave = async () => {
    if (!fileName) {
      return;
    }

    const exists = await isFile({
      path: fileName,
    });

    if (exists) {
      setConfirmationDialog({
        open: true,
        content: (
          <Trans
            i18nKey="todo.txt already exists. Do you want to replace it"
            values={{ fileName }}
          />
        ),
        buttons: [
          {
            text: t("Cancel"),
          },
          {
            text: t("Replace"),
            handler: createTodoFileAndSync,
          },
        ],
      });
    } else {
      await createTodoFileAndSync();
    }
  };

  const handleSelectCloudStorage = (cloudStorage: CloudStorage) => {
    setSelectedCloudStorage((currentValue) =>
      currentValue === cloudStorage ? undefined : cloudStorage
    );
  };

  const handleClose = useCallback(
    () => setFileCreateDialog((current) => ({ ...current, open: false })),
    [setFileCreateDialog]
  );

  const handleExited = () => setFileCreateDialog({ open: false });

  useEffect(() => {
    if (platform === "electron" && open) {
      getUniqueFilePath(defaultTodoFilePath).then(({ fileName }) => {
        window.electron.saveFile(fileName).then((filePath) => {
          handleClose();
          if (filePath) {
            createNewFile(filePath).catch((e) => console.debug(e));
          }
        });
      });
    }
    if (platform !== "electron" && open) {
      getUniqueFilePath(defaultTodoFilePath).then(({ fileName }) =>
        setFileName(fileName)
      );
    }
  }, [platform, open, getUniqueFilePath, createNewFile, handleClose]);

  if (platform === "electron") {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionProps={{ onExited: handleExited }}
    >
      <DialogTitle>
        {createExampleFile ? t("Create example file") : t("Create todo.txt")}
      </DialogTitle>
      <DialogContent>
        <TextField
          value={fileName}
          onChange={(event) => setFileName(event.target.value)}
          autoFocus={["ios", "android"].every((p) => p !== platform)}
          margin="normal"
          label={t("File Name")}
          fullWidth
          variant="outlined"
          inputProps={{
            "aria-label": "File name",
          }}
        />
        {Object.entries(cloudStorageClients)
          .filter(([_, client]) => client.status === "connected")
          .map(([cloudStorage]) => cloudStorage as CloudStorage)
          .map((cloudStorage) => (
            <FormControlLabel
              key={cloudStorage}
              control={
                <Checkbox
                  aria-label="Sync with cloud storage"
                  checked={selectedCloudStorage === cloudStorage}
                  onChange={() => handleSelectCloudStorage(cloudStorage)}
                />
              }
              label={t("Sync with cloud storage", { cloudStorage })}
            />
          ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("Cancel")}</Button>
        <Button
          aria-label="Create file"
          disabled={!fileName}
          onClick={handleSave}
        >
          {t("Create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileCreateDialog;
