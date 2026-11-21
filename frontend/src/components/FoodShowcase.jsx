
export default function FoodShowcase({ foods, tick }) {
  const totalFoods = foods.length;
  const angle = 360 / totalFoods;

  return (
    <div className="showcase">
      <div className="arc" />
      <div className="backdrop" />

      <div
        className="scene"
        style={{
          transform: `translateZ(calc(var(--r) * -1)) rotateY(${-tick * angle}deg)`
        }}
      >
        {foods.map((food, index) => {
          let distance =
            ((index - tick) % totalFoods + totalFoods) % totalFoods;

          if (distance > totalFoods / 2) {
            distance -= totalFoods;
          }

          const opacity =
            distance === 0 ? 1 :
            Math.abs(distance) === 1 ? 0.35 : 0;

          return (
            <div
              key={food.id}
              className="plate"
              style={{
                transform: `rotateY(${index * angle}deg) translateZ(var(--r))`,
                opacity
              }}
            >
              <div className="ph">
                {food.image ? (
                  <img src={food.image} alt={food.name} />
                ) : (
                  <span>Image coming soon</span>
                )}
                <b>{food.name}</b>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
