
export default function FoodShowcase({ foods, tick }) {
  const totalFoods = foods.length;
  const angle = 360 / totalFoods;

  return (
    <div className="showcase">
      {/* Decorative glow instead of the empty white circle */}
      <div className="showcase-glow" />
      <div className="showcase-orbit" />
      <div className="arc" />

      {/* 3D rotating food carousel */}
      <div
        className="scene"
        style={{
          transform: `translateZ(calc(var(--r) * -1)) rotateY(${-tick * angle}deg)`,
        }}
      >
        {foods.map((food, index) => {
          let distance =
            ((index - tick) % totalFoods + totalFoods) % totalFoods;

          if (distance > totalFoods / 2) {
            distance -= totalFoods;
          }

          const absDistance = Math.abs(distance);

          const opacity =
            absDistance === 0 ? 1 :
            absDistance === 1 ? 0.78 :
            absDistance === 2 ? 0.16 : 0.035;

          const scale =
            absDistance === 0 ? 1 :
            absDistance === 1 ? 0.78 :
            0.65;

          return (
            <div
              key={food.id}
              className={`plate ${absDistance === 0 ? "active-plate" : ""}`}
              style={{
                transform: `
                  rotateY(${index * angle}deg)
                  translateZ(var(--r))
                  scale(${scale})
                `,
                opacity,
              }}
            >
              <div className="plate-inner">
                {food.image ? (
                  <img src={food.image} alt={food.name} />
                ) : (
                  <div className="food-placeholder">🍽️</div>
                )}
              </div>

              <div className="plate-label">
                {food.name}
              </div>
            </div>
          );
        })}
      </div>

      <div className="carousel-caption">
        <span>FRESHLY PREPARED</span>
        <div />
      </div>
    </div>
  );
}
