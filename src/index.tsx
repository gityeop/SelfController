import { useState, useEffect } from "react";
import { Form, ActionPanel, Action, showToast, ToastStyle, getPreferenceValues } from "@raycast/api";
import { exec } from "child_process";

interface Preferences {
  userPassword: string;
}

const SelfControlForm = () => {
  const [time, setTime] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    const preferences = getPreferenceValues<Preferences>();
    if (preferences.userPassword) {
      setPassword(preferences.userPassword);
    }
  }, []);

  const handleSubmit = async () => {
    if (!time) {
      showToast(ToastStyle.Failure, "Please enter a time duration");
      return;
    }

    if (!password) {
      showToast(ToastStyle.Failure, "Please enter your password in the preferences");
      return;
    }

    try {
      const duration = parseInt(time, 10);
      if (isNaN(duration) || duration < 1 || duration > 1440) {
        showToast(ToastStyle.Failure, "Invalid time duration. Enter a value between 1 and 1440 minutes.");
        return;
      }

      const activateSelfControl = new Promise<void>((resolve, reject) => {
        const script = `osascript -e 'tell application "SelfControl" to activate'`;

        exec(script, (error, stdout, stderr) => {
          if (error) {
            console.error(`Activate SelfControl error: ${stderr}`);
            reject(error);
          } else {
            console.log(`Activate SelfControl output: ${stdout}`);
            resolve();
          }
        });
      });

      const setSliderValue = new Promise<void>((resolve, reject) => {
        const script = `
          osascript -e 'tell application "System Events"
            tell process "SelfControl"
              tell slider 1 of window 1
                set value to ${duration}
              end tell
            end tell
          end tell'
        `;

        exec(script, (error, stdout, stderr) => {
          if (error) {
            console.error(`Set Slider Value error: ${stderr}`);
            reject(error);
          } else {
            console.log(`Set Slider Value output: ${stdout}`);
            resolve();
          }
        });
      });

      const clickStartButton = new Promise<void>((resolve, reject) => {
        const script = `osascript -e 'tell application "System Events" to tell process "SelfControl" to click button "시작" of window 1'`;

        exec(script, (error, stdout, stderr) => {
          if (error) {
            console.error(`Click Start Button error: ${stderr}`);
            reject(error);
          } else {
            console.log(`Click Start Button output: ${stdout}`);
            resolve();
          }
        });
      });

      const passwordInput = new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          const script = `
            osascript -e 'tell application "System Events" to tell process "SecurityAgent" to set frontmost to true' \
                      -e 'delay 0.4' \
                      -e 'tell application "System Events" to keystroke "${password}"' \
                      -e 'delay 0.2' \
                      -e 'tell application "System Events" to keystroke return'
          `;

          exec(script, (error, stdout, stderr) => {
            if (error) {
              console.error(`Password Input error: ${stderr}`);
              reject(error);
            } else {
              console.log(`Password Input output: ${stdout}`);
              resolve();
            }
          });
        }, 200); // 대기 시간을 200밀리초로 설정
      });

      await Promise.all([activateSelfControl, setSliderValue, clickStartButton, passwordInput]);

      showToast(ToastStyle.Success, `SelfControl started for ${duration} minutes`);
    } catch (err: any) {
      console.error(`Overall error: ${err.message}`);
      showToast(ToastStyle.Failure, "Failed to start SelfControl", err.message);
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Start SelfControl" onAction={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="time"
        title="Time (in minutes)"
        placeholder="Enter time duration in minutes"
        value={time}
        onChange={setTime}
      />
    </Form>
  );
};

export default SelfControlForm;
