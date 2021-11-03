import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../data/AppContext";
import { useTask } from "../data/TaskContext";
import { useNotifications } from "../utils/notifications";
import { usePlatform } from "../utils/platform";
import LanguageSelect from "./LanguageSelect";
import ThemeModeSelect from "./ThemeModeSelect";
import TodoFilePicker from "./TodoFilePicker";

const Settings = () => {
  const { t } = useTranslation();
  const platform = usePlatform();
  const { checkPermissions, requestPermissions } = useNotifications();
  const { setSideSheetOpen, showNotifications, setShowNotifications } =
    useAppContext();
  const { todoFilePath } = useTask();
  const {
    createCompletionDate,
    createCreationDate,
    toggleCreateCompletionDate,
    toggleCreateCreationDate,
    closeTodoFile,
    tasksLoaded,
  } = useTask();

  const handleCloseFileClick = () => {
    closeTodoFile();
    setSideSheetOpen(false);
  };

  const handleShowNotifications = async () => {
    const currentState = await checkPermissions();
    if (!showNotifications && currentState.display !== "granted") {
      const response = await requestPermissions();
      setShowNotifications(response.display === "granted");
    } else {
      setShowNotifications(!showNotifications);
    }
  };

  const showTodoFilePath = !!todoFilePath && platform === "electron";

  return (
    <>
      <Typography component="div" variant="subtitle1" gutterBottom>
        {t("Appearance")}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <ThemeModeSelect />
      </Box>
      <Typography component="div" variant="subtitle1" gutterBottom>
        {t("Language")}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <LanguageSelect />
      </Box>
      <Typography component="div" variant="subtitle1" gutterBottom>
        todo.txt
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: showTodoFilePath ? 1 : 2 }}>
        <TodoFilePicker onSelect={() => setSideSheetOpen(false)}>
          {t("Open")}
        </TodoFilePicker>
        {tasksLoaded && (
          <Button
            onClick={handleCloseFileClick}
            startIcon={<CloseIcon />}
            fullWidth
            variant="outlined"
          >
            {t("Close")}
          </Button>
        )}
      </Stack>
      {showTodoFilePath && (
        <Alert
          severity="info"
          sx={{ mb: 2, wordBreak: "break-all", userSelect: "text" }}
        >
          {t("Current file", { filePath: todoFilePath })}
        </Alert>
      )}
      <Typography component="div" variant="subtitle1">
        {t("Dates")}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={createCreationDate}
              onChange={() => toggleCreateCreationDate()}
            />
          }
          label={t("Set creation date")}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={createCompletionDate}
              onChange={() => toggleCreateCompletionDate()}
            />
          }
          label={t("Set completion date")}
        />
      </Box>
      <Typography component="div" variant="subtitle1">
        {t("Notifications")}
      </Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={showNotifications}
            onChange={() => handleShowNotifications()}
          />
        }
        label={t("Due tasks")}
      />
    </>
  );
};

export default Settings;
