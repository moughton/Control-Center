import { useState } from 'react'

interface Recipe {
  title: string
  cal: number
  pro: number
  carbs: number
  fat: number
  source: string
}

const SAMPLE_MEAL_OPTIONS: Record<string, Recipe[]> = {
  meal1: [
    { title: 'Banana Bread Overnight Oats', cal: 383, pro: 32, carbs: 48, fat: 8, source: 'Obsidian Good Energy' },
    { title: 'Creamy Scrambled Eggs on Toast', cal: 420, pro: 28, carbs: 30, fat: 20, source: 'Jalal p. 45' },
    { title: 'Bangin’ Protein Smoothie', cal: 500, pro: 34, carbs: 42, fat: 12, source: 'Good Energy Shake' },
  ],
  meal2: [
    { title: 'Fresh Salmon Bowl', cal: 800, pro: 60, carbs: 67, fat: 24, source: 'Jalal p. 99 (2,700mg Omega-3)' },
    { title: 'Chicken Fajita Bowl', cal: 620, pro: 52, carbs: 55, fat: 16, source: 'Jalal p. 112' },
    { title: 'Crispy Salmon Fried Rice', cal: 710, pro: 55, carbs: 60, fat: 22, source: 'Jalal p. 88' },
  ],
  meal3: [
    { title: 'High Protein Quesadilla', cal: 450, pro: 38, carbs: 35, fat: 14, source: 'Jalal p. 34' },
    { title: 'Honey BBQ Chicken Tenders', cal: 410, pro: 45, carbs: 30, fat: 8, source: 'Jalal p. 76' },
    { title: 'Protein Rice Krispies Bar', cal: 220, pro: 20, carbs: 25, fat: 4, source: 'Snack Library' },
  ],
  meal4: [
    { title: 'Creamy Butter Chicken & Naan', cal: 650, pro: 58, carbs: 52, fat: 18, source: 'Jalal p. 104' },
    { title: 'Cheesy Beef Bolognese Tacos', cal: 620, pro: 54, carbs: 45, fat: 20, source: 'Jalal p. 62' },
    { title: 'Healthy Pad Thai', cal: 580, pro: 48, carbs: 65, fat: 14, source: 'Jalal p. 46' },
  ],
}

const SHOPPING_ITEMS = [
  { category: '🥩 Proteins & Seafood', item: 'Wild Atlantic Salmon Fillets (600g)', checked: false },
  { category: '🥩 Proteins & Seafood', item: 'Boneless Skinless Chicken Breast (1kg)', checked: false },
  { category: '🥩 Proteins & Seafood', item: 'Lean Ground Beef (85/15) (500g)', checked: false },
  { category: '🥩 Proteins & Seafood', item: 'Eggs (2 Dozen)', checked: false },
  { category: '🥬 Produce & Berries', item: 'Kirkland Three Berry Blend / Blueberries', checked: false },
  { category: '🥬 Produce & Berries', item: 'Avocados (Bag of 5)', checked: false },
  { category: '🥬 Produce & Berries', item: 'Organic Spinach & Broccoli', checked: false },
  { category: '🥑 Healthy Fats & Dairy', item: 'Extra Virgin Olive Oil (Seed-Oil Free)', checked: false },
  { category: '🥑 Healthy Fats & Dairy', item: 'Plain Greek Yogurt 2% & Cottage Cheese', checked: false },
  { category: '🌾 Pantry & Superfoods', item: 'Rolled Oats & Chia Seeds (Fibre Boost)', checked: false },
  { category: '🌾 Pantry & Superfoods', item: 'LeanFit Whey Vanilla Protein', checked: false },
]

export default function MealPlanner() {
  const [plannerTab, setPlannerTab] = useState<'daily' | 'weekly' | 'shopping' | 'fasting'>('daily')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({
    meal1: 0,
    meal2: 0,
    meal3: 0,
    meal4: 0,
  })
  const [shoppingList, setShoppingList] = useState(SHOPPING_ITEMS)

  // Fasting state (16:8 Protocol)
  const [fastingWindow] = useState({ protocol: '16:8', startHour: 20, endHour: 12 })

  function toggleShopItem(index: number) {
    setShoppingList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, checked: !item.checked } : item))
    )
  }

  // Calculate chosen daily totals
  const totalCal =
    SAMPLE_MEAL_OPTIONS.meal1[selectedOptions.meal1].cal +
    SAMPLE_MEAL_OPTIONS.meal2[selectedOptions.meal2].cal +
    SAMPLE_MEAL_OPTIONS.meal3[selectedOptions.meal3].cal +
    SAMPLE_MEAL_OPTIONS.meal4[selectedOptions.meal4].cal

  const totalPro =
    SAMPLE_MEAL_OPTIONS.meal1[selectedOptions.meal1].pro +
    SAMPLE_MEAL_OPTIONS.meal2[selectedOptions.meal2].pro +
    SAMPLE_MEAL_OPTIONS.meal3[selectedOptions.meal3].pro +
    SAMPLE_MEAL_OPTIONS.meal4[selectedOptions.meal4].pro

  return (
    <div className="meal-planner-container" style={{ marginTop: '16px' }}>
      {/* Sub-Tab Navigation */}
      <div className="filter-chips" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className={`filter-chip ${plannerTab === 'daily' ? 'active' : ''}`}
          onClick={() => setPlannerTab('daily')}
        >
          🍱 4-Meal Plan (3 Choice Options)
        </button>
        <button
          type="button"
          className={`filter-chip ${plannerTab === 'fasting' ? 'active' : ''}`}
          onClick={() => setPlannerTab('fasting')}
        >
          ⏱️ Intermittent Fasting (16:8)
        </button>
        <button
          type="button"
          className={`filter-chip ${plannerTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setPlannerTab('shopping')}
        >
          🛒 Weekly Grocery Shopping List
        </button>
      </div>

      {/* TAB 1: DAILY 4-MEAL CHOICE ARCHITECTURE */}
      {plannerTab === 'daily' && (
        <div>
          {/* Target Macro Readout */}
          <div className="gtg-stats-card" style={{ marginBottom: '16px', background: '#064e3b', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#6ee7b7' }}>Daily Good Energy Macro Budget</h3>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>Target: 2,400 kcal · 160g Protein · 50g Fibre · 2,000mg Omega-3</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fef08a' }}>{totalCal} kcal</span>
                <br />
                <span style={{ fontSize: '12px', color: '#a7f3d0' }}>{totalPro}g Protein Chosen</span>
              </div>
            </div>
          </div>

          {/* 4 MEALS WITH 3 CHOICE OPTIONS EACH */}
          {[
            { key: 'meal1', title: 'Meal 1: Break-Fast (12:00 PM)', options: SAMPLE_MEAL_OPTIONS.meal1 },
            { key: 'meal2', title: 'Meal 2: Lunch (2:30 PM)', options: SAMPLE_MEAL_OPTIONS.meal2 },
            { key: 'meal3', title: 'Meal 3: Afternoon Fuel (5:00 PM)', options: SAMPLE_MEAL_OPTIONS.meal3 },
            { key: 'meal4', title: 'Meal 4: Dinner (7:30 PM)', options: SAMPLE_MEAL_OPTIONS.meal4 },
          ].map((m) => (
            <section key={m.key} className="analytics-section" style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{m.title}</h3>
              <p className="subtitle" style={{ fontSize: '12px', marginBottom: '10px' }}>
                Select 1 of 3 options for this meal:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {m.options.map((opt, idx) => {
                  const isSelected = selectedOptions[m.key] === idx
                  return (
                    <div
                      key={opt.title}
                      onClick={() => setSelectedOptions((prev) => ({ ...prev, [m.key]: idx }))}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: isSelected ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--card-bg)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)' }}>
                          Option {String.fromCharCode(65 + idx)} {isSelected ? '✓ Selected' : ''}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opt.source}</span>
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '14px' }}>{opt.title}</h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        🔥 {opt.cal} kcal · 🥩 {opt.pro}g Pro · 🥑 {opt.fat}g Fat
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* TAB 2: INTERMITTENT FASTING (16:8) */}
      {plannerTab === 'fasting' && (
        <section className="analytics-section">
          <h2>⏱️ Intermittent Fasting Tracker ({fastingWindow.protocol} Protocol)</h2>
          <p className="subtitle">Daily 16-hour fasting window (8:00 PM to 12:00 PM) for metabolic health & cellular autophagy.</p>

          <div className="gtg-stats-card" style={{ textAlign: 'center', padding: '24px', background: '#022c22', color: 'white', borderRadius: '12px', marginTop: '12px' }}>
            <span style={{ fontSize: '12px', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Status</span>
            <h1 style={{ fontSize: '36px', color: '#10b981', margin: '8px 0' }}>14 hrs 20 mins Fasted</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#fef08a' }}>🔥 Phase: Fat Oxidation & Ketosis Active</p>
            <span style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px', display: 'block' }}>Eating Window Opens: 12:00 PM</span>
          </div>
        </section>
      )}

      {/* TAB 3: AUTOMATED WEEKLY GROCERY SHOPPING LIST */}
      {plannerTab === 'shopping' && (
        <section className="analytics-section">
          <h2>🛒 Automated Weekly Grocery Shopping List</h2>
          <p className="subtitle">Aggregated ingredients across all 4 meals for the week. Tap item to check off during shopping.</p>

          <div className="analytics-bar-list" style={{ marginTop: '12px' }}>
            {shoppingList.map((item, idx) => (
              <div
                key={item.item}
                onClick={() => toggleShopItem(idx)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: item.checked ? 'color-mix(in srgb, var(--text-muted) 15%, transparent)' : 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  textDecoration: item.checked ? 'line-through' : 'none',
                  opacity: item.checked ? 0.6 : 1,
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{item.category}</span>
                  <span style={{ fontWeight: 'bold' }}>{item.item}</span>
                </div>
                <input type="checkbox" checked={item.checked} readOnly style={{ width: '18px', height: '18px' }} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
