import { useEffect } from "react";

export default function useUnsavedChangesWarning(shouldWarn: boolean) {
  useEffect(() => {
    if (!shouldWarn) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [shouldWarn]);
}
