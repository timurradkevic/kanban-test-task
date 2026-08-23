type TaskItemPreviewProps = {
  name: string;
  description?: string;
};

export const TaskItemPreview = ({
  name,
  description,
}: TaskItemPreviewProps) => {
  return (
    <div className="text-gray-500 italic border p-2 rounded mb-2 w-full bg-white shadow-lg rotate-2 cursor-grabbing">
      <h3 className="font-semibold">{name}</h3>
      {description && (
        <p className="text-sm wrap-break-word">
          {description.slice(0, 100)}
          {description.length > 100 ? '...' : ''}
        </p>
      )}
    </div>
  );
};
