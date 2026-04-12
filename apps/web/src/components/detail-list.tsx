export function DetailList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="detail-list">
      <p className="detail-list__title">{title}</p>
      {items.length ? (
        <ul className="detail-list__items">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="helper-text">{emptyText}</p>
      )}
    </div>
  );
}
