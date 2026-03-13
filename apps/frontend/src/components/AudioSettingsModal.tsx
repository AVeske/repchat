type Props = {
  isOpen: boolean;
  onClose: () => void;

  inputVolume: number;
  onChangeInputVolume: (value: number) => void;

  outputVolume: number;
  onChangeOutputVolume: (value: number) => void;
};

export default function AudioSettingsModal({
  isOpen,
  onClose,
  inputVolume,
  onChangeInputVolume,
  outputVolume,
  onChangeOutputVolume,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Audio Settings</h3>
            <p className="mt-1 text-sm text-slate-400">
              Control your voice playback and microphone preferences.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200">
                Input Volume
              </label>
              <span className="text-xs text-slate-400">{inputVolume}%</span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={inputVolume}
              onChange={(event) =>
                onChangeInputVolume(Number(event.target.value))
              }
              className="w-full"
            />

            <p className="mt-2 text-xs text-slate-500">
              Visual setting for now. Real microphone gain can be added later.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200">
                Output Volume
              </label>
              <span className="text-xs text-slate-400">{outputVolume}%</span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={outputVolume}
              onChange={(event) =>
                onChangeOutputVolume(Number(event.target.value))
              }
              className="w-full"
            />

            <p className="mt-2 text-xs text-slate-500">
              This controls how loudly you hear other people in voice chat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
