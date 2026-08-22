export const TaskItem = (task: { name: string; description?: string }) => {
  return (
    <div className="text-gray-500 italic">
      <h3 className="font-semibold">{task.name}</h3>
      {task.description && <p className="text-sm">{task.description}</p>}
    </div>
  );
};
