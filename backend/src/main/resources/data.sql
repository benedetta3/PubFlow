DELETE FROM ordine_item;
DELETE FROM ordine;
DELETE FROM prenotazione;
DELETE FROM menu_item;
DELETE FROM tavoli;

ALTER TABLE menu_item ALTER COLUMN id RESTART WITH 1;
ALTER TABLE ordine ALTER COLUMN id RESTART WITH 1;
ALTER TABLE prenotazione ALTER COLUMN id RESTART WITH 1;
ALTER TABLE tavoli ALTER COLUMN id RESTART WITH 1;

INSERT INTO tavoli (numero, capienza, stato) VALUES
  (1, 4, 'LIBERO'),
  (2, 4, 'LIBERO'),
  (3, 4, 'LIBERO'),
  (4, 4, 'LIBERO'),
  (5, 6, 'LIBERO'),
  (6, 6, 'LIBERO'),
  (7, 6, 'LIBERO'),
  (8, 10, 'LIBERO'),
  (9, 10, 'LIBERO');

INSERT INTO menu_item (nome, descrizione, prezzo, categoria, disponibile, quantita_disponibile) VALUES
  ('Birra Artigianale', 'IPA locale 33cl', 5.50, 'BIRRE', TRUE, 24),
  ('Birra Rossa', 'Strong ale 50cl', 6.50, 'BIRRE', TRUE, 18),
  ('Birra Lager', 'Bionda 50cl', 4.50, 'BIRRE', TRUE, 30),
  ('Leffe Rouge', 'Birra d''Abbazia 33cl, vol 6,6%', 5.50, 'BIRRE', TRUE, 20),
  ('Leffe Blonde', 'Birra d''Abbazia 33cl, vol 6,6%', 5.00, 'BIRRE', TRUE, 20),
  ('Black Angus', 'Panino al sesamo, hamburger Black Angus 200gr, cheddar, pomodoro, lattuga, bacon croccante, salsa irlandese, patatine rosse dolci', 15.00, 'PANINI', TRUE, 10),
  ('Smokey Burger', 'Hamburger 170gr, mozzarella di bufala Campana D.O.P., bacon croccante, salsa smokey, pomodoro, lattuga, crema di pecorino molisano', 12.00, 'PANINI', TRUE, 12),
  ('DCLAPS', 'Panino al sesamo, hamburger home-made 170gr, mortadella al pistacchio I.G.P., rucola, burratina DOP 125gr, crema al pistacchio di Bronte, granella di pistacchio', 12.00, 'PANINI', TRUE, 8),
  ('Double P.', 'Doppio hamburger 170gr, doppia scamorza affumicata, doppia pancetta, pomodoro, maionese, salsa barbecue, tabasco', 12.00, 'PANINI', TRUE, 9),
  ('Big Pepito', 'Hamburger home-made 170gr, doppia scamorza affumicata, pancetta arrotolata, bacon affumicato, pomodoro, maionese, salsa barbecue, tabasco', 8.00, 'PANINI', TRUE, 11),
  ('Pepito', 'Hamburger home-made 170gr, scamorza affumicata, pancetta arrotolata, pomodoro, maionese', 6.00, 'PANINI', TRUE, 14),
  ('Bufalo Bill', 'Panino al sesamo, hamburger di bufalo 200gr, maionese al pepe nero, mozzarella di bufala, pomodoro, lattuga, salsa BBQ, porzione di patate dippers', 15.00, 'PANINI', TRUE, 6),
  ('Eddie Rocket''s', 'Panino al sesamo, hamburger 170gr, doppio cheddar, pomodoro, lattuga, anelli di cipolla, bacon, maionese, salsa BBQ', 9.00, 'PANINI', TRUE, 10),
  ('Tartufo Burger', 'Hamburger 170gr, salsa tartufata, maionese al pepe nero, guanciale, uovo all''occhio di bue, scaglie di parmigiano, lattuga, porzione di patate buccia', 15.00, 'PANINI', TRUE, 7),
  ('Bacon Burger', 'Hamburger home-made 180gr, bacon croccante, formaggio cheddar, pomodoro, lattuga, maionese, salsa BBQ', 8.00, 'PANINI', TRUE, 12),
  ('Queso', 'Hamburger home-made 180gr, scamorza affumicata, Philadelphia, mozzarella, maionese', 6.00, 'PANINI', TRUE, 9),
  ('Patate Rosse', 'Dritte dall''America, patate rosse 100% naturali, croccanti, saporite e fuori dal comune', 5.00, 'FRITTI', TRUE, 20),
  ('Chicken Chips', '6 croccanti chips di filetto di pollo panate', 3.50, 'FRITTI', TRUE, 18),
  ('Philadelphia''s Crispy', '10 palline di Philadelphia ed erba cipollina', 4.00, 'FRITTI', TRUE, 16),
  ('Mini Corn Dog', 'Mini wurstel pastellati croccanti (4 pz)', 3.00, 'FRITTI', TRUE, 14),
  ('Supplìcini', 'Bocconcini di riso al pomodoro con cuore di mozzarella filante (6 pz)', 4.00, 'FRITTI', TRUE, 12),
  ('Spiedino di Pollo BBQ', 'Spiedino di pollo alla piastra marinato in salsa BBQ', 4.00, 'FRITTI', TRUE, 10),
  ('Green Heroes Chikn Nuggets Vegano', '6 pezzi', 4.00, 'FRITTI', FALSE, 0),
  ('Alette di Pollo', '5 alette di pollo speziate alla paprika', 5.50, 'FRITTI', TRUE, 12),
  ('Anelli di cipolla', '8 anelli di cipolla pastellati', 3.50, 'FRITTI', TRUE, 18),
  ('Bandidos', '7 straccetti di pollo panati al BBQ', 5.50, 'FRITTI', TRUE, 10),
  ('Cheddar Nuggets', '6 bocconcini di formaggio cheddar con pezzi di peperoncino jalapeno', 3.50, 'FRITTI', TRUE, 14),
  ('Chele di granchio', '5 chele di granchio panate', 4.00, 'FRITTI', TRUE, 12),
  ('Jalapeno', '6 bocconcini di formaggio cremoso con pezzetti di peperoncino jalapeno', 3.50, 'FRITTI', TRUE, 12),
  ('Mozza Sticks al Bacon', '4 stick di mozzarella panati e ricoperti di bacon croccante', 5.00, 'FRITTI', TRUE, 10),
  ('Mozza Stick', '4 stick di mozzarella panati', 4.00, 'FRITTI', TRUE, 12),
  ('Mozzarelle Panate', '6 bocconcini di mozzarella panati', 3.50, 'FRITTI', TRUE, 16),
  ('Turkey Toast', 'Pane tostato con tacchino e cheddar', 3.00, 'FRITTI', TRUE, 12),
  ('Salami Toast', 'Pane tostato con schiacciata e scamorza', 3.00, 'FRITTI', TRUE, 12),
  ('Veggie Toast', 'Pane tostato con rucola, scamorza e cheddar', 3.00, 'FRITTI', TRUE, 12),
  ('Meteoritos', 'Filetto di pollo avvolto in una croccante panatura speziata', 5.00, 'FRITTI', TRUE, 10),
  ('Patata Twister', 'Patata speziata alla paprika dolce tagliata a cavatappi', 4.00, 'FRITTI', TRUE, 16),
  ('Tris Salse Heinz', 'Bustina ketchup 11g, bustina BBQ 9g, bustina mayo 9,5g', 0.30, 'FRITTI', TRUE, 30),
  ('Patatina Stick 13x13', 'Patatina tagliata a bastoncino extra crunch', 3.50, 'FRITTI', TRUE, 22),
  ('Patatina Dippers', 'Patata al naturale tagliata a ricciolo con buccia', 3.50, 'FRITTI', TRUE, 20),
  ('Gnocchi Fritti', 'Gnocchi di patata fritti', 3.50, 'FRITTI', TRUE, 18),
  ('Acqua Naturale', 'Bottiglia da 500cc', 1.50, 'BEVANDE', TRUE, 50),
  ('Ferrarelle', 'Bottiglia da 0,5 cl', 1.50, 'BEVANDE', TRUE, 40),
  ('Coca Cola', 'Bottiglia vetro da 0,33 cl', 2.50, 'BEVANDE', TRUE, 45),
  ('Coca Cola Zero', 'Bottiglia vetro da 0,33 cl', 2.50, 'BEVANDE', TRUE, 40),
  ('Fanta', 'Bottiglia vetro da 0,33 cl', 2.50, 'BEVANDE', TRUE, 40),
  ('Sprite', 'Bottiglia vetro da 0,33 cl', 2.50, 'BEVANDE', TRUE, 40),
  ('Soufflé Cioccolato', 'Tortino al cacao con un cuore fuso di cioccolato fondente', 4.00, 'DOLCI', TRUE, 12),
  ('Moonshine', 'Panino con crema di pistacchio, crema al cioccolato bianco, Cocopops e Twix', 4.00, 'DOLCI', TRUE, 10),
  ('Tiramisù', 'Deliziosa crema di mascarpone e pan di spagna imbevuto al caffè', 4.00, 'DOLCI', FALSE, 0);

INSERT INTO ordine (numero_ordine, data_ora, tipo_ordine, stato, totale, telefono_cliente, numero_tavolo, indirizzo_consegna)
VALUES
  (1001, CURRENT_TIMESTAMP, 'TAVOLO', 'RICEVUTO', 16.40, '3331234567', 5, NULL),
  (1002, CURRENT_TIMESTAMP, 'DOMICILIO', 'IN_PREPARAZIONE', 19.40, '3339876543', NULL, 'Via Roma 10'),
  (1003, CURRENT_TIMESTAMP, 'ASPORTO', 'PRONTO', 13.50, '3331112223', NULL, NULL);

INSERT INTO ordine_item (quantita, menu_item_id, ordine_id) VALUES
  (1, 1, 1),
  (1, 2, 1),
  (1, 3, 1),
  (2, 4, 2),
  (1, 5, 2),
  (1, 2, 3);

INSERT INTO prenotazione (numero_prenotazione, nome_cliente, telefono_cliente, numero_persone, data, ora, stato) VALUES
  (2001, 'Marco Rossi', '3334445566', 4, CURRENT_DATE, '20:00:00', 'CONFERMATA'),
  (2002, 'Laura Bianchi', '3337778899', 2, CURRENT_DATE, '21:00:00', 'CONFERMATA');
