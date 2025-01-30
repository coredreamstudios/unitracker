-- Drop existing tables if they exist
DROP TABLE IF EXISTS wrestlers;
DROP TABLE IF EXISTS championships;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS weight_classes;
DROP TABLE IF EXISTS wrestler_types;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS factions;

-- Create brands table
CREATE TABLE brands (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Create shows table
CREATE TABLE shows (
    id INTEGER PRIMARY KEY,
    show_name TEXT NOT NULL UNIQUE,
    brand_id INTEGER,
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Create factions table
CREATE TABLE factions (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    brand_id INTEGER,
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Create weight_classes table
CREATE TABLE weight_classes (
    id INTEGER PRIMARY KEY,
    class_name TEXT NOT NULL UNIQUE
);

-- Create wrestler_types table
CREATE TABLE wrestler_types (
    id INTEGER PRIMARY KEY,
    type_name TEXT NOT NULL UNIQUE
);

-- Create championships table
CREATE TABLE championships (
    id INTEGER PRIMARY KEY,
    title_name TEXT NOT NULL,
    show_id INTEGER,
    is_tag_team INTEGER DEFAULT 0,
    current_holder_id INTEGER,
    FOREIGN KEY (show_id) REFERENCES shows(id),
    FOREIGN KEY (current_holder_id) REFERENCES wrestlers(id)
);

-- Create wrestlers table
CREATE TABLE wrestlers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    brand_id INTEGER,
    faction_id INTEGER,
    type_id INTEGER,
    weight_class_id INTEGER,
    alignment TEXT CHECK(alignment IN ('Face', 'Heel', 'Tweener')) DEFAULT 'Face',
    is_champion INTEGER DEFAULT 0,
    is_in_faction INTEGER DEFAULT 0,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (faction_id) REFERENCES factions(id),
    FOREIGN KEY (type_id) REFERENCES wrestler_types(id),
    FOREIGN KEY (weight_class_id) REFERENCES weight_classes(id)
);

-- Insert default brands
INSERT INTO brands (name) VALUES 
    ('RAW'),
    ('SmackDown'),
    ('NXT'),
    ('TNA');

-- Insert default shows
INSERT INTO shows (show_name, brand_id) VALUES 
    ('RAW', 1),
    ('SmackDown', 2),
    ('NXT', 3),
    ('TNA', 4);

-- Insert default weight classes
INSERT INTO weight_classes (class_name) VALUES 
    ('Cruiserweight'),
    ('Light Heavyweight'),
    ('Heavyweight'),
    ('Super Heavyweight');

-- Insert default wrestler types
INSERT INTO wrestler_types (type_name) VALUES 
    ('High Flyer'),
    ('Technical'),
    ('Powerhouse'),
    ('Brawler'),
    ('All-Rounder');

-- Insert default championships
INSERT INTO championships (title_name, show_id, is_tag_team) VALUES 
    ('World Heavyweight Championship', 1, 0),
    ('Intercontinental Championship', 1, 0),
    ('RAW Tag Team Championship', 1, 1),
    ('Universal Championship', 2, 0),
    ('United States Championship', 2, 0),
    ('SmackDown Tag Team Championship', 2, 1),
    ('NXT Championship', 3, 0),
    ('North American Championship', 3, 0),
    ('NXT Tag Team Championship', 3, 1),
    ('TNA World Championship', 4, 0),
    ('X-Division Championship', 4, 0),
    ('TNA Tag Team Championship', 4, 1);
