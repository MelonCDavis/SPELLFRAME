export default function CardQuantityOverlay({
  quantity = 0,
  onDecrement,
  onIncrement,
}) {
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      onMouseDown={stop}
      onClick={stop}
      style={{
        position: "absolute",
        left: "50%",
        top: "63%",              
        transform: "translate(-50%, -50%)",

        width: "42%",            
        aspectRatio: "1 / 1",

        backgroundColor: "rgba(110,110,110,0.75)",
        borderRadius: "10px",

        color: "#f0e6d8",

        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",

        userSelect: "none",
        pointerEvents: "auto",
      }}
    >
      {/* ( # ) */}
      <div
        style={{
          fontSize: "28px",
          lineHeight: "1",
          fontWeight: 500,
          marginBottom: "6px",
        }}
      >
        ({quantity})
      </div>

      {/* - / + */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          fontSize: "28px",
          lineHeight: "1",
          fontWeight: 500,
        }}
      >
        <span onClick={onDecrement}>−</span>
        <span>/</span>
        <span onClick={onIncrement}>+</span>
      </div>
    </div>
  );
}
