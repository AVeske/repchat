type Props = {
  username: string;
  isOnline?: boolean;
  size?: number;
};

function getInitial(username: string) {
  const trimmed = username.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "?";
}

export default function AvatarCircle({ username, isOnline, size = 34 }: Props) {
  const borderColor =
    isOnline === true
      ? "border-emerald-400/80 shadow-emerald-500/20"
      : "border-slate-600";

  const style = {
    width: size,
    height: size,
  };

  return (
    <div
      style={style}
      title={isOnline === true ? "Online" : "Offline"}
      className={`grid shrink-0 place-items-center rounded-full border-2 bg-slate-900 text-xs font-bold text-slate-200 shadow ${borderColor}`}
    >
      {getInitial(username)}
    </div>
  );
}
