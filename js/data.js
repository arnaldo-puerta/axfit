// AxFit — datos de alimentos, menús, ejercicios y motivación.
// Valores nutricionales aproximados por porción, tomados de USDA FoodData Central
// y del Sistema Mexicano de Alimentos Equivalentes (SMAE). Redondeados.

const FOODS = {
  huevo:      { n: 'Huevo entero',              base: '1 pieza (50 g)',          kcal: 72,  p: 6.3, c: 0.4, f: 4.8, fib: 0,   cat: 'proteina', precio: '$' },
  pechuga:    { n: 'Pechuga de pollo cocida',   base: '100 g',                   kcal: 165, p: 31,  c: 0,   f: 3.6, fib: 0,   cat: 'proteina', precio: '$$' },
  muslo:      { n: 'Muslo/pierna de pollo sin piel', base: '100 g cocido',       kcal: 190, p: 26,  c: 0,   f: 9,   fib: 0,   cat: 'proteina', precio: '$' },
  atun:       { n: 'Atún en agua (drenado)',    base: '100 g (≈ 1 lata chica)',  kcal: 116, p: 25.5,c: 0,   f: 0.8, fib: 0,   cat: 'proteina', precio: '$' },
  sardina:    { n: 'Sardina en tomate',         base: '100 g',                   kcal: 185, p: 21,  c: 1,   f: 10.5,fib: 0,   cat: 'proteina', precio: '$' },
  molida:     { n: 'Carne molida de res 90/10', base: '100 g cocida',            kcal: 217, p: 26,  c: 0,   f: 11.8,fib: 0,   cat: 'proteina', precio: '$$' },
  panela:     { n: 'Queso panela',              base: '30 g',                    kcal: 75,  p: 5.5, c: 1,   f: 5.4, fib: 0,   cat: 'proteina', precio: '$' },
  yogurt:     { n: 'Yogurt natural sin azúcar', base: '1 taza (240 g)',          kcal: 150, p: 8.5, c: 11.5,f: 8,   fib: 0,   cat: 'lacteo',   precio: '$' },
  leche:      { n: 'Leche semidescremada',      base: '1 taza (240 ml)',         kcal: 105, p: 8,   c: 12,  f: 2.5, fib: 0,   cat: 'lacteo',   precio: '$' },
  avena:      { n: 'Avena en hojuelas (cruda)', base: '40 g (½ taza)',           kcal: 152, p: 5.3, c: 27,  f: 2.7, fib: 4,   cat: 'carbo',    precio: '$' },
  arroz:      { n: 'Arroz integral cocido',     base: '½ taza (98 g)',           kcal: 108, p: 2.5, c: 22.4,f: 0.9, fib: 1.8, cat: 'carbo',    precio: '$' },
  camote:     { n: 'Camote cocido',             base: '100 g (½ pieza chica)',   kcal: 90,  p: 2,   c: 20.7,f: 0.2, fib: 3.3, cat: 'carbo',    precio: '$' },
  papa:       { n: 'Papa cocida con cáscara',   base: '1 mediana (150 g)',       kcal: 130, p: 2.9, c: 30,  f: 0.2, fib: 2.7, cat: 'carbo',    precio: '$' },
  verdura:    { n: 'Verduras cocidas (brócoli, calabacita, chayote, ejote, espinaca)', base: '1 taza', kcal: 35, p: 2.5, c: 7, f: 0.3, fib: 3, cat: 'verdura', precio: '$' },
  nopal:      { n: 'Nopales cocidos',           base: '1 taza',                  kcal: 22,  p: 2,   c: 5,   f: 0.1, fib: 3,   cat: 'verdura',  precio: '$' },
  ensalada:   { n: 'Ensalada (lechuga, jitomate, pepino, cebolla)', base: '2 tazas', kcal: 30, p: 1.5, c: 6, f: 0.2, fib: 2.5, cat: 'verdura', precio: '$' },
  jicama:     { n: 'Jícama o pepino con limón', base: '1 taza',                  kcal: 46,  p: 0.9, c: 10.6,f: 0.1, fib: 5.9, cat: 'verdura',  precio: '$' },
  aguacate:   { n: 'Aguacate',                  base: '⅓ pieza (50 g)',          kcal: 80,  p: 1,   c: 4.3, f: 7.3, fib: 3.4, cat: 'grasa',    precio: '$$' },
  cacahuate:  { n: 'Cacahuate natural (sin sal)', base: '20 g (un puño chico)',  kcal: 113, p: 5.2, c: 3.2, f: 9.8, fib: 1.7, cat: 'grasa',    precio: '$' },
  aceite:     { n: 'Aceite (canola u oliva)',   base: '1 cucharadita (5 ml)',    kcal: 40,  p: 0,   c: 0,   f: 4.5, fib: 0,   cat: 'grasa',    precio: '$' },
  manzana:    { n: 'Manzana',                   base: '1 mediana',               kcal: 95,  p: 0.5, c: 25,  f: 0.3, fib: 4.4, cat: 'fruta',    precio: '$' },
  naranja:    { n: 'Naranja',                   base: '1 mediana',               kcal: 62,  p: 1.2, c: 15.4,f: 0.2, fib: 3.1, cat: 'fruta',    precio: '$' },
  platano:    { n: 'Plátano',                   base: '1 mediano',               kcal: 105, p: 1.3, c: 27,  f: 0.4, fib: 3.1, cat: 'fruta',    precio: '$' },
  papaya:     { n: 'Papaya',                    base: '1 taza picada',           kcal: 62,  p: 0.7, c: 15.7,f: 0.4, fib: 2.5, cat: 'fruta',    precio: '$' },
  guayaba:    { n: 'Guayaba',                   base: '2 piezas',                kcal: 75,  p: 2.8, c: 16,  f: 1,   fib: 6,   cat: 'fruta',    precio: '$' },
};

const MEAL_INFO = {
  desayuno: { t: 'Desayuno',     icon: 'egg' },
  colacion: { t: 'Colación',     icon: 'apple' },
  comida:   { t: 'Comida',       icon: 'utensils' },
  pre:      { t: 'Pre‑entreno',  icon: 'zap' },
  cena:     { t: 'Cena',         icon: 'bowl' },
};

// Horarios de comida según el tipo de día
const MEAL_TIMES = {
  trabajo: { desayuno: '5:45', colacion: '10:30', comida: 'Tu hora de comida (ideal 13:00–14:00)', pre: '17:30 (en el camión)', cena: '21:10 (después de entrenar)' },
  escuela: { desayuno: '7:00', colacion: '10:30', comida: '14:00', pre: '17:30', cena: '20:30' },
  finde:   { desayuno: '8:30', colacion: '11:30', comida: '14:30', pre: '17:30', cena: '20:30' },
};

// Menús: índice 0 = domingo … 6 = sábado (igual que Date.getDay()).
// Cada item: [alimento, multiplicador de la porción base, texto de la porción]
const MENUS = [
  { // Domingo
    titulo: 'Domingo · día de preparar comida',
    tipo: 'finde',
    comidas: {
      desayuno: { plato: 'Omelette de espinaca con queso panela', items: [['huevo',4,'4 huevos'],['verdura',1,'1 taza de espinaca'],['panela',1,'30 g panela'],['aceite',1,'1 cdita'],['papaya',1,'1 taza']] },
      colacion: { plato: 'Yogurt con cacahuate y naranja', items: [['yogurt',1,'1 taza'],['cacahuate',1,'20 g'],['naranja',1,'1 pieza']] },
      comida:   { plato: 'Pollo asado con nopales y camote (si salen a comer: pollo o carne asada + ensalada, sin tortilla de harina ni refresco)', items: [['pechuga',2,'200 g'],['nopal',1,'1 taza'],['camote',1,'100 g'],['ensalada',1,'2 tazas'],['aguacate',1,'⅓ pieza']] },
      pre:      { plato: 'Fruta y huevos cocidos para el paseo', items: [['manzana',1,'1 pieza'],['huevo',2,'2 huevos cocidos']] },
      cena:     { plato: 'Ensalada de atún con huevo y aguacate', items: [['atun',1.4,'1 lata grande (140 g)'],['huevo',2,'2 huevos cocidos'],['ensalada',1,'2 tazas'],['aguacate',1,'⅓ pieza'],['aceite',1,'1 cdita']] },
    },
  },
  { // Lunes
    titulo: 'Lunes · trabajo',
    tipo: 'trabajo',
    comidas: {
      desayuno: { plato: 'Avena remojada con yogurt y canela (la dejas lista la noche anterior) + 2 huevos cocidos', items: [['yogurt',1,'1 taza'],['avena',1,'40 g'],['huevo',2,'2 huevos cocidos']] },
      colacion: { plato: 'Huevos cocidos con jícama y naranja', items: [['huevo',2,'2 huevos cocidos'],['jicama',1,'1 taza'],['naranja',1,'1 pieza']] },
      comida:   { plato: 'Pechuga a la plancha con arroz integral y verduras', items: [['pechuga',2.3,'230 g'],['arroz',1,'½ taza'],['verdura',2,'2 tazas'],['aguacate',1,'⅓ pieza'],['aceite',1,'1 cdita']] },
      pre:      { plato: 'Manzana con queso panela y cacahuate', items: [['manzana',1,'1 pieza'],['panela',1,'30 g'],['cacahuate',1,'20 g']] },
      cena:     { plato: 'Ensalada de atún con huevo cocido', items: [['atun',1.4,'1 lata grande (140 g)'],['huevo',2,'2 huevos cocidos'],['ensalada',1,'2 tazas'],['aceite',1,'1 cdita']] },
    },
  },
  { // Martes
    titulo: 'Martes · trabajo',
    tipo: 'trabajo',
    comidas: {
      desayuno: { plato: 'Huevos a la mexicana + camote cocido del domingo + papaya', items: [['huevo',3,'3 huevos'],['verdura',1,'jitomate, cebolla, chile'],['aceite',0.5,'½ cdita'],['camote',1,'100 g'],['papaya',1,'1 taza']] },
      colacion: { plato: 'Huevos cocidos con jícama, naranja y cacahuate', items: [['huevo',2,'2 huevos cocidos'],['jicama',1,'1 taza'],['naranja',1,'1 pieza'],['cacahuate',1,'20 g']] },
      comida:   { plato: 'Pechuga con camote y verduras', items: [['pechuga',2.3,'230 g'],['camote',1,'100 g'],['verdura',2,'2 tazas'],['aceite',1,'1 cdita']] },
      pre:      { plato: 'Yogurt con plátano', items: [['yogurt',1,'1 taza'],['platano',1,'1 pieza']] },
      cena:     { plato: 'Sardinas en tomate con ensalada y aguacate', items: [['sardina',1.5,'1 lata chica (150 g)'],['ensalada',1,'2 tazas'],['aguacate',1,'⅓ pieza'],['aceite',1,'1 cdita']] },
    },
  },
  { // Miércoles
    titulo: 'Miércoles · trabajo',
    tipo: 'trabajo',
    comidas: {
      desayuno: { plato: 'Avena con leche (cocida la noche anterior, solo calientas) + 3 huevos', items: [['avena',1,'40 g'],['leche',1,'1 taza'],['huevo',3,'3 huevos']] },
      colacion: { plato: 'Atún con pepino y limón', items: [['atun',1,'1 lata chica (100 g)'],['jicama',1,'pepino o jícama']] },
      comida:   { plato: 'Tinga de pollo (sin tostada) con arroz integral y verduras', items: [['pechuga',2.3,'230 g'],['arroz',1,'½ taza'],['verdura',2,'2 tazas'],['aguacate',1,'⅓ pieza'],['aceite',1,'1 cdita']] },
      pre:      { plato: 'Guayabas con panela y cacahuate', items: [['guayaba',1,'2 piezas'],['panela',1,'30 g'],['cacahuate',1,'20 g']] },
      cena:     { plato: 'Omelette de verduras con panela', items: [['huevo',4,'4 huevos'],['verdura',1,'1 taza'],['panela',1,'30 g'],['ensalada',1,'2 tazas'],['aceite',1,'1 cdita']] },
    },
  },
  { // Jueves
    titulo: 'Jueves · trabajo',
    tipo: 'trabajo',
    comidas: {
      desayuno: { plato: 'Huevos con espinaca + avena remojada con leche y canela', items: [['huevo',3,'3 huevos'],['verdura',1,'1 taza espinaca'],['aceite',0.5,'½ cdita'],['avena',1,'40 g'],['leche',1,'1 taza']] },
      colacion: { plato: 'Yogurt con naranja', items: [['yogurt',1,'1 taza'],['naranja',1,'1 pieza']] },
      comida:   { plato: 'Pierna de pollo al horno con papa y verduras', items: [['muslo',2.2,'220 g'],['papa',1,'1 mediana'],['verdura',2,'2 tazas'],['aceite',1,'1 cdita']] },
      pre:      { plato: 'Manzana y huevos cocidos', items: [['manzana',1,'1 pieza'],['huevo',2,'2 huevos cocidos']] },
      cena:     { plato: 'Ensalada de atún con huevo y aguacate', items: [['atun',1.4,'1 lata grande (140 g)'],['huevo',2,'2 huevos cocidos'],['ensalada',1,'2 tazas'],['aguacate',1,'⅓ pieza'],['aceite',1,'1 cdita']] },
    },
  },
  { // Viernes
    titulo: 'Viernes · CBTis',
    tipo: 'escuela',
    comidas: {
      desayuno: { plato: 'Avena con leche + 3 huevos', items: [['avena',1,'40 g'],['leche',1,'1 taza'],['huevo',3,'3 huevos']] },
      colacion: { plato: 'Huevos cocidos con naranja (para la mochila)', items: [['huevo',2,'2 huevos cocidos'],['naranja',1,'1 naranja']] },
      comida:   { plato: 'Pollo a la plancha con arroz integral y verduras', items: [['pechuga',2.3,'230 g'],['arroz',1,'½ taza'],['verdura',2,'2 tazas'],['aguacate',1,'⅓ pieza'],['aceite',1,'1 cdita']] },
      pre:      { plato: 'Yogurt con cacahuate', items: [['yogurt',1,'1 taza'],['cacahuate',1,'20 g']] },
      cena:     { plato: 'Atún con huevo, camote y ensalada', items: [['atun',1.4,'1 lata grande'],['huevo',1,'1 huevo cocido'],['camote',1,'100 g'],['ensalada',1,'2 tazas'],['aceite',1,'1 cdita']] },
    },
  },
  { // Sábado
    titulo: 'Sábado · tareas y paseo',
    tipo: 'finde',
    comidas: {
      desayuno: { plato: 'Huevos rancheros sin tortilla + aguacate', items: [['huevo',4,'4 huevos'],['verdura',1,'salsa casera de jitomate'],['aguacate',1,'⅓ pieza'],['papaya',1,'1 taza']] },
      colacion: { plato: 'Guayabas con cacahuate', items: [['guayaba',1,'2 piezas'],['cacahuate',1,'20 g']] },
      comida:   { plato: 'Si salen: pollo o carne asada + nopales + ensalada. En casa: pollo con papa', items: [['pechuga',2.3,'230 g'],['nopal',1,'1 taza'],['papa',1,'1 mediana'],['ensalada',1,'2 tazas'],['aguacate',1,'⅓ pieza']] },
      pre:      { plato: 'Yogurt con manzana y cacahuate', items: [['yogurt',1,'1 taza'],['manzana',1,'1 pieza'],['cacahuate',1,'20 g']] },
      cena:     { plato: 'Ensalada de atún con huevo y panela', items: [['atun',1.4,'1 lata grande'],['huevo',1,'1 huevo cocido'],['panela',1,'30 g'],['ensalada',1,'2 tazas'],['aceite',1,'1 cdita']] },
    },
  },
];

const SHOPPING = [
  { g: 'Proteína (lo más importante)', items: ['Huevo: 1½ tapas de 30 por semana (la proteína más barata)', 'Pollo: pechuga ~2 kg + pierna-muslo ~½ kg', 'Atún en agua: 8 latas chicas (o 6 grandes)', 'Sardina en tomate: 1 lata', 'Queso panela: 400 g', 'Yogurt natural SIN azúcar: 1 litro', 'Leche semidescremada: 1 litro'] },
  { g: 'Carbohidratos buenos', items: ['Avena en hojuelas: ½ kg', 'Arroz integral: ½ kg', 'Camote: ½ kg', 'Papa: 3 piezas'] },
  { g: 'Verduras (sin límite)', items: ['Nopales', 'Brócoli o calabacita', 'Chayote', 'Espinaca', 'Jitomate, cebolla, chile, ajo', 'Lechuga y pepino', 'Jícama', 'Limones'] },
  { g: 'Fruta (2–3 al día)', items: ['Plátano', 'Manzana', 'Naranja', 'Papaya', 'Guayaba — compra la de temporada, es la más barata'] },
  { g: 'Grasas buenas', items: ['Aguacate: 2–3 piezas', 'Cacahuate natural sin sal: 250 g', 'Aceite de canola u oliva'] },
];

const MEAL_PREP = [
  { t: 'Domingo (60–90 min)', items: ['Cuece 12 huevos duros: son tus colaciones y cenas de la semana.', 'Cocina 1.5 kg de pollo (pechuga a la plancha o hervida y deshebrada) para lunes a miércoles.', 'Cuece arroz integral para 3 días.', 'Lava y pica verduras; guárdalas en bolsas o recipientes.', 'Arma los tuppers del lunes y martes.'] },
  { t: 'Miércoles en la noche (20 min)', items: ['Hornea o cuece la pierna de pollo y el camote para jueves y viernes.', 'Arma tuppers de jueves.'] },
  { t: 'Cada noche (5 min)', items: ['Deja listo tu tupper y colaciones en el refri.', 'Para la avena remojada: ½ taza de avena + 1 taza de yogurt + canela en un frasco. Al otro día está lista.'] },
];

const FOOD_RULES = [
  { t: 'Proteína en cada comida', d: 'Pollo, atún, huevo, sardina, panela o yogurt. Te mantiene lleno y protege tu músculo mientras bajas grasa.' },
  { t: 'Mitad del plato: verduras', d: 'Son baratas, llenan mucho y casi no aportan calorías. Si te quedas con hambre, repite verduras.' },
  { t: 'Carbohidratos: pocos y buenos', d: 'Solo avena, arroz integral, camote, papa con cáscara y fruta entera, en porciones chicas (½ taza). Nada de pan, galletas, harinas ni azúcar. Los carbos van de día, cuando más los usas.' },
  { t: 'Solo agua natural', d: 'Meta: 2.5–3 litros al día. Café o té sin azúcar está bien. Nada de refresco, jugos ni bebidas "light" de sobre.' },
  { t: 'Lee las etiquetas', d: 'Si el producto tiene sellos negros de "Exceso azúcares" o "Exceso calorías", déjalo en el anaquel.' },
  { t: 'No te saltes comidas', d: 'Saltarte el desayuno o la comida hace que llegues con hambre feroz en la noche. Estás en crecimiento: necesitas energía constante.' },
];

// ---------- EJERCICIO ----------
// Todo en casa, sin equipo (mochila con libros = peso). Bajo impacto para cuidar rodillas.
const EXERCISES = {
  sentadilla_silla: { n: 'Sentadilla a la silla', m: 'Piernas, glúteo', how: ['Párate frente a una silla, pies al ancho de hombros.', 'Baja la cadera hacia atrás hasta tocar la silla apenas.', 'Sube empujando con los talones. Pecho arriba.'], tip: 'Rodillas en dirección de las puntas de los pies.' },
  sentadilla_mochila: { n: 'Sentadilla con mochila', m: 'Piernas, glúteo', how: ['Abraza la mochila con libros contra el pecho.', 'Baja controlado 3 segundos, sube en 1.', 'Baja hasta donde puedas sin levantar talones.'], tip: 'Si duele la rodilla, regresa a la silla.' },
  flexion_pared: { n: 'Flexiones en pared o mesa', m: 'Pecho, brazos', how: ['Manos en la orilla de una mesa firme o en la pared.', 'Cuerpo recto de cabeza a talones.', 'Baja el pecho a la mesa y empuja.'], tip: 'Mientras más bajo el apoyo, más difícil.' },
  flexion_rodillas: { n: 'Flexiones con rodillas', m: 'Pecho, brazos', how: ['Apoya rodillas y manos en el piso.', 'Baja el pecho manteniendo la espalda recta.', 'Empuja hasta estirar brazos.'], tip: 'Cuando hagas 15 seguidas, pasa a flexiones completas.' },
  remo_mochila: { n: 'Remo con mochila', m: 'Espalda, bíceps', how: ['Inclínate hacia adelante con espalda recta, rodillas un poco dobladas.', 'Jala la mochila hacia tu ombligo.', 'Aprieta la espalda 1 segundo y baja lento.'], tip: 'Es clave para la postura después de tantas horas sentado.' },
  puente: { n: 'Puente de glúteo', m: 'Glúteo, espalda baja', how: ['Acostado boca arriba, rodillas dobladas.', 'Sube la cadera apretando glúteos.', 'Sostén 2 segundos y baja.'], tip: 'Para más dificultad, pon la mochila sobre la cadera.' },
  plancha: { n: 'Plancha', m: 'Abdomen', how: ['Antebrazos en el piso, cuerpo recto.', 'Aprieta abdomen y glúteo.', 'Respira normal.'], tip: 'Si es mucho, apoya rodillas.' },
  zancada: { n: 'Zancada estática', m: 'Piernas', how: ['Un pie adelante y otro atrás.', 'Baja la rodilla de atrás hacia el piso.', 'Sube. Haz todas de un lado y cambia.'], tip: 'Apóyate en una pared si pierdes el equilibrio.' },
  peso_muerto: { n: 'Peso muerto rumano con mochila', m: 'Femoral, glúteo, espalda', how: ['Mochila en las manos, piernas casi rectas.', 'Lleva la cadera hacia atrás bajando la mochila por tus muslos.', 'Sube apretando glúteo. Espalda siempre recta.'], tip: 'Bajar hasta las rodillas está perfecto.' },
  escalon: { n: 'Subir escalón', m: 'Piernas, cardio', how: ['Usa un escalón firme de la casa.', 'Sube con un pie, sube el otro, baja.', 'Alterna la pierna que inicia.'], tip: 'Sin saltar. Ritmo constante.' },
  dead_bug: { n: 'Dead bug (bicho muerto)', m: 'Abdomen profundo', how: ['Boca arriba, brazos al techo, rodillas a 90°.', 'Estira brazo derecho y pierna izquierda sin despegar la espalda baja.', 'Regresa y cambia.'], tip: 'Lento y controlado.' },
  bird_dog: { n: 'Bird dog', m: 'Espalda baja, abdomen', how: ['En cuatro puntos.', 'Estira brazo y pierna contraria.', 'Sostén 2 s, regresa, cambia.'], tip: 'Cadera nivelada, como si cargaras un vaso en la espalda.' },
  marcha: { n: 'Marcha rodillas altas', m: 'Cardio', how: ['Marcha en tu lugar subiendo las rodillas.', 'Mueve los brazos fuerte.'], tip: 'Sin saltar: cuida rodillas y tobillos.' },
  step_jack: { n: 'Jumping jack sin salto', m: 'Cardio', how: ['Abre un pie al lado mientras subes los brazos.', 'Regresa y cambia de lado.'], tip: 'Versión de bajo impacto.' },
  boxeo: { n: 'Boxeo de sombra', m: 'Cardio, hombros', how: ['Guardia arriba, pies separados.', 'Lanza golpes rápidos al aire.', 'Muévete de lado a lado.'], tip: 'Pon música que te prenda.' },
  sentadilla_rapida: { n: 'Sentadilla rápida', m: 'Cardio, piernas', how: ['Sentadillas a ritmo rápido sin rebotar.'], tip: 'Calidad antes que velocidad.' },
  escaladores: { n: 'Escaladores lentos', m: 'Cardio, abdomen', how: ['Manos en una silla o mesa (más fácil) o en el piso.', 'Lleva una rodilla al pecho y cambia.'], tip: 'Manos elevadas = menos carga en hombros.' },
  burpee_bajo: { n: 'Burpee sin salto', m: 'Cuerpo completo', how: ['Agáchate y pon las manos en el piso.', 'Lleva un pie atrás y luego el otro (plancha).', 'Regresa los pies y ponte de pie.'], tip: 'Solo en fase 3.' },
  bulgara: { n: 'Sentadilla búlgara', m: 'Piernas, glúteo', how: ['Pie trasero apoyado en una silla.', 'Baja la rodilla de atrás.', 'Sube empujando con el pie de adelante.'], tip: 'Difícil: empieza sin peso.' },
};

// Fases del programa. Semana = semanas desde el inicio.
const PHASES = [
  { id: 1, desde: 1, hasta: 4,  n: 'Fase 1 · Adaptación', d: 'Aprende la técnica, crea el hábito. Termina cada sesión sintiendo que podías un poco más.', series: 2, reps: '10–12', descanso: 60, cardio: { work: 30, rest: 30, rondas: 10 } },
  { id: 2, desde: 5, hasta: 8,  n: 'Fase 2 · Construcción', d: 'Más series y ejercicios más difíciles. Debe costar trabajo las últimas 2 repeticiones.', series: 3, reps: '12–15', descanso: 60, cardio: { work: 40, rest: 20, rondas: 12 } },
  { id: 3, desde: 9, hasta: 999, n: 'Fase 3 · Quema', d: 'Variantes avanzadas y más volumen. Si algo duele (no confundir con cansancio), regresa a la versión fácil.', series: 4, reps: '10–15', descanso: 45, cardio: { work: 40, rest: 20, rondas: 15 } },
];

// Rutinas por día de la semana (0 = domingo)
const WEEK_PLAN = [
  { tipo: 'descanso', n: 'Descanso activo', d: 'Estiramiento 10 min + preparar la comida de la semana. Grabar video de progreso.', hora: 'Libre' },
  { tipo: 'fuerza', rutina: 'A', n: 'Fuerza A · cuerpo completo', d: 'Fuerza + 10 min de cardio al final', hora: '20:00 – 21:00' },
  { tipo: 'cardio', n: 'Cardio por intervalos + abdomen', d: 'Intervalos de bajo impacto + core', hora: '20:00 – 20:45' },
  { tipo: 'fuerza', rutina: 'B', n: 'Fuerza B · cuerpo completo', d: 'Fuerza + 10 min de cardio al final', hora: '20:00 – 21:00' },
  { tipo: 'fuerza', rutina: 'A', n: 'Fuerza A · cuerpo completo', d: 'Fuerza + 10 min de cardio al final', hora: '20:00 – 21:00' },
  { tipo: 'caminata', n: 'Caminata rápida', d: '30–45 min caminando rápido (puedes ir/regresar del CBTis caminando una parte)', hora: 'Cuando puedas' },
  { tipo: 'caminata', n: 'Paseo activo', d: 'Camina con tus abuelos. Meta: 8,000+ pasos. Opcional: repetir Fuerza B si te sobra energía.', hora: 'Durante el paseo' },
];

const ROUTINES = {
  A: {
    1: ['sentadilla_silla', 'flexion_pared', 'remo_mochila', 'puente', 'plancha'],
    2: ['sentadilla_mochila', 'flexion_rodillas', 'remo_mochila', 'puente', 'zancada', 'plancha'],
    3: ['sentadilla_mochila', 'flexion_rodillas', 'remo_mochila', 'bulgara', 'puente', 'plancha'],
  },
  B: {
    1: ['sentadilla_silla', 'peso_muerto', 'flexion_pared', 'escalon', 'dead_bug', 'bird_dog'],
    2: ['sentadilla_mochila', 'peso_muerto', 'flexion_rodillas', 'escalon', 'remo_mochila', 'dead_bug'],
    3: ['bulgara', 'peso_muerto', 'flexion_rodillas', 'escalon', 'remo_mochila', 'dead_bug', 'bird_dog'],
  },
  cardio: {
    1: ['marcha', 'step_jack', 'boxeo', 'sentadilla_rapida'],
    2: ['marcha', 'step_jack', 'boxeo', 'escaladores', 'sentadilla_rapida'],
    3: ['marcha', 'boxeo', 'escaladores', 'burpee_bajo', 'sentadilla_rapida'],
  },
  finisher: ['marcha', 'boxeo', 'step_jack'],
  core: ['plancha', 'dead_bug', 'bird_dog'],
};

const WARMUP = ['Marcha en tu lugar 1 min', 'Círculos de brazos 30 s', 'Círculos de cadera 30 s', '10 sentadillas lentas', '10 rotaciones de tronco', 'Marcha rápida 1 min'];
const COOLDOWN = ['Estira cuádriceps 30 s cada pierna', 'Estira femoral 30 s cada pierna', 'Estira pecho en una puerta 30 s', 'Respiración profunda 1 min'];

// ---------- MAÑANAS CON ENERGÍA ----------
// Lun–Jue: despiertas 5:20 y necesitas estar al 100 a las 8:00.
const MORNING = [
  { t: 'Lo que más pesa: dormir', d: 'Con 4–5 horas ningún desayuno ni vitamina quita la niebla mental. Cada 30 min que adelantes la hora de dormir se notan a las 8 am. Usa el camión para dormir (ver abajo).' },
  { t: 'Al despertar: agua y luz', d: 'Un vaso grande de agua (amaneces deshidratado y eso cansa la mente). Prende todas las luces o asómate afuera: la luz fuerte le dice a tu cerebro que ya es de día. Agua fría en la cara.' },
  { t: 'Desayuno ligero, no pesado', d: 'Proteína (huevo, yogurt) + un carbohidrato lento (avena, camote o fruta) + poca grasa. La grasa en exceso se digiere lento y te hace sentir pesado; el azúcar y el pan te suben y luego te tumban a media mañana.' },
  { t: 'Listo la noche anterior', d: 'Deja la avena remojando en el refri y los huevos cocidos desde el domingo. A las 5:45 solo sirves y comes en 10 min, sin prisa.' },
  { t: 'Duerme en el camión, pero despierta antes', d: 'Duerme de 6:15 a ~7:30 con alarma. Despierta 20–30 min antes de bajar: así se te quita el atontamiento de la siesta antes de entrar a trabajar. Toma agua al despertar.' },
  { t: 'Café: opcional y con límite', d: 'Si te gusta, máximo 1 taza sin azúcar, después del desayuno y antes de las 12. Nada de bebidas energéticas: a tu edad no se recomiendan y te quitan el sueño en la noche.' },
  { t: 'Hidrátate en el trabajo', d: 'Medio litro de agua entre 8 y 10 am. Si te da sueño a media mañana, levántate 2 minutos y camina.' },
];

// ---------- SUPLEMENTO: COMPLEJO B ----------
const VIT_B = {
  intro: 'Tiamina (B1), piridoxina (B6) y cianocobalamina (B12). No interfiere con tu dieta ni con el ejercicio y no tiene calorías.',
  puntos: [
    { t: '¿Me va a dar energía?', d: 'Las vitaminas B ayudan a convertir la comida en energía, pero tomar más no da más energía si no te faltan. Si te sientes cansado, casi siempre es por dormir poco. Si un médico te las recetó por una deficiencia, ahí sí pueden ayudarte a sentirte mejor.' },
    { t: 'Tu dieta ya trae mucha vitamina B', d: 'B12: huevo, atún, sardina, pollo, leche y yogurt (comes de sobra). B6: pollo, atún, plátano, papa y camote. B1: avena, arroz integral y cacahuate.' },
    { t: 'Revisa la etiqueta: el límite es la B6', d: 'A los 14–18 años el máximo seguro de B6 es 80 mg al día. Muchas tabletas de Complejo B en México traen 50–100 mg o más. Tomar de más por meses puede causar hormigueo o adormecimiento en manos y pies. Si tu tableta pasa de 80 mg o tomas más de una al día, pregúntale al médico.' },
    { t: 'B1 y B12', d: 'No tienen un límite máximo establecido: lo que sobra se elimina por la orina. En algunas personas las dosis altas de B12 pueden sacar acné; si te pasa, coméntalo con el médico.' },
    { t: 'Cómo tomarla', d: 'En la mañana, con el desayuno (con comida cae mejor al estómago). Nunca te inyectes vitaminas por tu cuenta: las inyecciones solo con receta.' },
    { t: 'Díselo al médico', d: 'Si la compraste tú, menciónalo en tu consulta del IMSS para que decida si la necesitas y por cuánto tiempo.' },
  ],
};

// ---------- MOTIVACIÓN (textos originales) ----------
const MOTIVATION = [
  'No necesitas un día perfecto. Necesitas un día mejor que tirar la toalla.',
  'Cada huevo cocido en tu mochila es una decisión que tu yo del futuro te agradece.',
  'El camión, el trabajo, la escuela… y aun así entrenas. Eso no lo hace cualquiera.',
  'La báscula se mueve lento. Tu disciplina se mueve rápido. Concéntrate en la segunda.',
  'Hoy no se trata de bajar 10 kilos. Se trata de cumplir las comidas de hoy.',
  'Un mal día de comida no arruina nada. Lo que arruina es rendirse después.',
  'Estás construyendo un cuerpo que te va a acompañar toda la vida. Vale la pena hacerlo bien.',
  'Si hoy solo tienes energía para 20 minutos, haz 20 minutos. Cuenta.',
  'Tu yo de dentro de 6 meses está viendo este momento. Dale algo de qué estar orgulloso.',
  'Programar te enseñó que nada sale a la primera. Tu cuerpo funciona igual: iterar, mejorar, repetir.',
  'El antojo dura 15 minutos. El orgullo de no caer dura todo el día.',
  'Dormir también es entrenar. Tu cuerpo se arregla mientras duermes.',
  'No compites con nadie. Solo con quien eras la semana pasada.',
  'Los resultados no llegan por motivación; llegan por repetición.',
  'Agua, proteína, verduras, movimiento, sueño. Cinco cosas. Puedes con cinco cosas.',
  'Cuando grabes tu video, recuerda: la versión de hoy es la que vas a querer ver en un año.',
  'Cansado no es lo mismo que derrotado.',
  'Cada sentadilla es un commit. Cada semana es un release.',
  'Tus abuelos te ven crecer. Que te vean crecer fuerte.',
  'La disciplina es elegir lo que quieres más sobre lo que quieres ahora.',
  'No es castigo: es cuidarte. Te lo mereces.',
  'Si fallaste ayer, hoy es el mejor día para regresar. No el lunes. Hoy.',
  'Paso a paso también se llega. Y se llega mejor.',
  'Tu cuerpo está en desarrollo, y tus hábitos también. Ambos se construyen hoy.',
  'Lo difícil de hoy es lo normal de dentro de un mes.',
  'Ningún entrenamiento te va a hacer sentir peor de lo que te sentirías por no hacerlo.',
  'Cocinar el domingo es la mitad de la batalla de la semana.',
  'No necesitas más tiempo. Necesitas usar mejor 60 minutos.',
  'Pequeño progreso sigue siendo progreso.',
  'Hoy, una decisión buena. Mañana, otra. Así se construye todo.',
];

const SOS = [
  { t: 'Tengo un antojo fuerte', d: ['Toma un vaso grande de agua y espera 15 minutos.', 'Come algo de tu plan: huevo cocido, jícama, pepino o una fruta.', 'Lávate los dientes: el sabor a menta corta el antojo.', 'Sal a caminar 5 minutos o cambia de actividad.'] },
  { t: 'No tengo ganas de entrenar', d: ['Haz el trato de solo 10 minutos. Si después de 10 quieres parar, para.', 'Ponte la ropa de entrenar. Casi siempre eso es suficiente.', 'Pon tu canción favorita y haz solo el calentamiento.', 'Ve tu primer video de progreso. Recuerda por qué empezaste.'] },
  { t: 'Ya comí algo que no debía', d: ['No pasa nada. Una comida no define tu progreso.', 'No te castigues sin comer: sigue con tu siguiente comida normal.', 'Toma agua y duerme bien hoy.', 'Mañana regresas al plan como si nada.'] },
  { t: 'La báscula no se mueve', d: ['Es normal estancarse 1–2 semanas, sobre todo si estás ganando músculo.', 'Revisa tu cintura con la cinta: a veces baja aunque el peso no.', 'Revisa si estás durmiendo suficiente y tomando agua.', 'Compara tus videos: el espejo y la ropa mienten menos que un número.'] },
  { t: 'Estoy muy cansado(a)', d: ['Si dormiste menos de 6 horas, hoy cambia el entrenamiento por 20 min de caminata y estiramiento.', 'Prioriza dormir hoy, aunque sea 30 minutos antes.', 'Revisa que estés comiendo todas tus comidas: comer muy poco también cansa.'] },
];

const BADGES = [
  { id: 'primer_paso', n: 'Primer paso', d: 'Completa tu primer entrenamiento', icon: 'walk' },
  { id: 'racha3', n: 'En llamas', d: '3 días seguidos cumpliendo', icon: 'flame' },
  { id: 'racha7', n: 'Semana completa', d: '7 días seguidos cumpliendo', icon: 'star' },
  { id: 'racha30', n: 'Imparable', d: '30 días seguidos cumpliendo', icon: 'trophy' },
  { id: 'video1', n: 'En cámara', d: 'Graba tu primer video de progreso', icon: 'video' },
  { id: 'video4', n: 'Documentalista', d: '4 videos de progreso', icon: 'calendar' },
  { id: 'menos2', n: '−2 kg', d: 'Baja 2 kg desde el inicio', icon: 'trendDown' },
  { id: 'menos5', n: '−5%', d: 'Baja el 5% de tu peso inicial', icon: 'target' },
  { id: 'menos10', n: '−10%', d: 'Baja el 10% de tu peso inicial', icon: 'award' },
  { id: 'entrenos10', n: '10 entrenamientos', d: 'Completa 10 sesiones', icon: 'dumbbell' },
  { id: 'entrenos50', n: '50 entrenamientos', d: 'Completa 50 sesiones', icon: 'trophy' },
];

const SOURCES = [
  { n: 'American Academy of Pediatrics (2023). Guía de práctica clínica para evaluación y tratamiento de la obesidad en niños y adolescentes. Pediatrics 151(2).', url: 'https://doi.org/10.1542/peds.2022-060640', uso: 'Enfoque de pérdida de peso seguro en adolescentes, cambios de hábitos y acompañamiento médico.' },
  { n: 'Organización Mundial de la Salud (2020). Directrices sobre actividad física y hábitos sedentarios.', url: 'https://www.who.int/publications/i/item/9789240015128', uso: 'Adolescentes: 60 min/día de actividad moderada‑vigorosa y fuerza al menos 3 días por semana.' },
  { n: 'Lloyd R.S. et al. (2014). Consenso internacional sobre entrenamiento de fuerza en jóvenes. British Journal of Sports Medicine.', url: 'https://doi.org/10.1136/bjsports-2013-092952', uso: 'El entrenamiento de fuerza con buena técnica es seguro y beneficioso para adolescentes.' },
  { n: 'Paruthi S. et al. (2016). Horas de sueño recomendadas para niños y adolescentes. Journal of Clinical Sleep Medicine (AASM).', url: 'https://doi.org/10.5664/jcsm.5866', uso: 'Adolescentes de 13–18 años: 8–10 horas de sueño.' },
  { n: 'USDA FoodData Central — base de datos de composición de alimentos.', url: 'https://fdc.nal.usda.gov/', uso: 'Calorías y macronutrientes de cada alimento.' },
  { n: 'Sistema Mexicano de Alimentos Equivalentes (SMAE), 4ª ed. Pérez Lizaur A.B. et al.', url: '', uso: 'Porciones y alimentos accesibles en México.' },
  { n: 'Mifflin M.D., St Jeor S.T. et al. (1990). Ecuación de gasto energético en reposo. Am J Clin Nutr 51(2).', url: 'https://doi.org/10.1093/ajcn/51.2.241', uso: 'Cálculo de tus calorías de mantenimiento.' },
  { n: 'NIH Office of Dietary Supplements — Vitamina B6 (ficha para profesionales).', url: 'https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/', uso: 'Límite máximo de B6 a los 14–18 años (80 mg/día) y riesgo de neuropatía por exceso.' },
  { n: 'NIH Office of Dietary Supplements — Vitamina B12 y Tiamina (fichas para profesionales).', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/', uso: 'Fuentes de B12 y B1 en alimentos; sin límite máximo establecido.' },
  { n: 'NOM‑051‑SCFI/SSA1‑2010 (modificación 2020) — etiquetado frontal de advertencia.', url: '', uso: 'Evitar productos con sellos de exceso de azúcares/calorías.' },
];
