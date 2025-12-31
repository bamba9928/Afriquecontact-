"""
Mapping exhaustif des quartiers par ville (département).
Chaque clé = nom du département, valeur = liste des quartiers réels.
"""

"""
À placer dans: catalog/management/commands/data/quartiers_mapping.py
"""

QUARTIERS_PAR_VILLE = {
    # RÉGION DE DAKAR
    "Dakar": [
        "Plateau", "Point E", "Mermoz", "Sacré-Cœur", "Almadies", "Fann Résidence",
        "Ngor", "Yoff", "Amitié", "Liberté 6", "Grand Yoff", "Parcelles Assainies",
        "HLM", "Colobane", "Médina", "Gueule Tapée", "Fass", "Dieuppeul-Derklé",
        "Sicap Baobab", "Zone B", "Hann Maristes", "Ouakam", "Cité Keur Gorgui",
        "Cambérène", "Bel-Air", "Hann", "Grand Dakar", "Sicap Liberté", "Fann-Point E",
    ],

    "Pikine": [
        "Grand Standing", "Cité Ousmane Ngom", "Quartiers universitaires", "Centre-ville",
        "Thiaroye", "Yeumbeul", "Sam Notaire", "Golf Sud", "Guinaw Rails",
        "Dalifort", "Pikine Nord", "Pikine Ouest", "Wakhinane Nimzatt",
        "Ndiarème Limamoulaye", "Hamo", "Médina Gounass", "Malika",
        "Djiddah Thiaroye Kao", "Tivaouane Diacksao", "Mbao",
    ],

    "Rufisque": [
        "Rufisque Centre", "Diaksao", "Bargny", "Sendou", "Diamniadio", "Sébi Ponty",
        "Golf", "Médina Rufisque", "Cité Sipres", "Gouye Mouride",
        "Jaxay", "Niaga", "Yène", "Tassette", "Bargny Minam",
    ],

    "Guédiawaye": [
        "Médina Gounass", "Golf Sud", "Ndiarème Limamoulaye", "Wakhinane Nimzatt",
        "Sam Notaire", "Hamo", "Golf Nord", "Sahm", "Ndiarème",
    ],

    "Keur Massar": [
        "Keur Massar Centre", "Keur Massar Nord", "Yeumbeul Nord", "Bambilor",
        "Sangalkam", "Tivaouane Peulh", "Lac Rose", "Kounoune", "Malika",
    ],

    # RÉGION DE SAINT-LOUIS
    "Saint-Louis": [
        "Île Saint-Louis", "Sor", "Guet Ndar", "Dakhar Bango", "Gandiol",
        "Ndar Toute", "Pikine Saint-Louis", "Balacoss", "Ndiolofène", "Léona",
        "Eaux Claires", "Khor", "Diamaguène", "Corniche", "Hydrobase", "Sanar",
        "Goxumbacc", "Darou", "Nord", "Médina Course", "Quartier Ndiaye",
    ],

    "Dagana": [
        "Richard Toll", "Ross Béthio", "Dagana Centre", "Ronkh", "Mbane",
        "Rosso Sénégal", "Gaé Dagana", "Bokhol", "Diama",
    ],

    "Podor": [
        "Podor Centre", "Golléré", "Ndioum", "Guédé Village", "Guédé Chantier",
        "Thilogne", "Gamadji Saré", "Démette", "Fanaye", "Pété", "Doumga Lao",
    ],

    # RÉGION DE LOUGA
    "Louga": [
        "Escale", "Léona", "Bongane", "Médina Mbaba", "Quartiers autour du marché central",
        "Keur Serigne Louga", "Quartier Ndiaye", "Quartier Artisanal", "Montagne",
        "Santhiaba", "Artillerie", "Touba Seras", "Grand Louga", "Cité Port",
        "Ngagne", "Darou Mousty", "Sakhal",
    ],

    "Kébémer": [
        "Kébémer Centre", "Ndande", "Leur Gare", "Sagatta Djolof",
        "Darou Mousty Kébémer", "Thieppe", "Guinguinéo Kébémer",
    ],

    "Linguère": [
        "Linguère Centre", "Dodji", "Yang Yang", "Barkédji", "Dahra",
        "Labgar", "Tessékéré", "Ouarkhokh", "Thiargny",
    ],

    # RÉGION DE ZIGUINCHOR
    "Ziguinchor": [
        "Lyndiane", "Santhiaba", "Tilène", "Kandialang", "Djibélor", "Bourofaye",
        "Néma", "Diabir", "Boucotte", "Escale", "Castors", "Belfort", "Peyrissac",
        "Kandé", "Coboda", "Colobane", "Lindiane", "Grand Dakar", "Quinzambougou",
        "Boulevard", "Kansahoudy", "Boutoupa",
    ],

    "Bignona": [
        "Bignona Centre", "Thionck Essyl", "Diouloulou", "Kafountine",
        "Tendouck", "Mangagoulack", "Kartiack", "Niafarang", "Elinkine",
    ],

    "Oussouye": [
        "Oussouye Centre", "Cap Skirring", "Cabrousse", "Diembéring",
        "Mlomp", "Kabrousse Station", "Eloubalir",
    ],

    # RÉGION DE DIOURBEL
    "Diourbel": [
        "Ndame", "Ngoye", "Tock", "Keur Goumack", "Darou Salam Ndame",
        "Quartier Thiamène", "Champ de Courses",
    ],

    "Bambey": [
        "Bambey Centre", "Keur Samba Kane", "Lambaye", "Ngoye Bambey",
        "Réfane", "Bary", "Ndondol",
    ],

    "Mbacké": [
        "Quartiers autour de Touba Mosquée", "Darou Khoudoss", "Gouye Mbind",
        "Médinatoul", "Keur Cheikh", "Darou Miname", "Darou Marnane",
        "Dianatoul Mahwa", "Guédé", "Héliport", "Touba Al Azhar",
        "Boukhatoul Moubarak", "Khaïra", "Ndamatou",
        "Darou Rahmane", "Darou Nahim", "Ndindy", "Darou Salam Type",
    ],

    # RÉGION DE THIÈS
    "Thiès": [
        "Ndiagne", "Quartiers périphériques", "Grand Thiès", "Cité Lamy",
        "Quartier Médina Fall", "Dixième", "Som", "Hersent", "Diakhao",
        "Ballabey", "Cité Malick Sy", "Sampathé", "Ibrahima Sarr", "Silhouette",
        "Tak hikaw", "Randoulène Nord", "Foire", "Nguinth", "Touba Toul",
    ],

    "M'bour": [
        "Mbour 1", "Mbour 2", "Mbour 3", "Saly Portudal", "Saly Niakhniakhal",
        "Ngaparou", "Somone", "Nianing", "Popenguine", "Malicounda",
        "Thiadiaye", "Joal-Fadiouth", "Palmarin Facao",
    ],

    "Tivaouane": [
        "Tivaouane Centre", "Mékhé", "Pout", "Kayar", "Taïba Ndiaye",
        "Notto Diobass", "Koul", "Darou Khoudoss Tivaouane",
    ],

    # RÉGION DE FATICK
    "Fatick": [
        "Mindiss", "Escale Fatick", "Peulgha", "Logandème", "Darou Salam",
        "Djilass", "Passy", "Tattaguine", "Loul Sessène", "Nioro Alassane Tall",
    ],

    "Foundiougne": [
        "Foundiougne Centre", "Toubacouta", "Soum", "Dionewar", "Mbam",
        "Ndangane", "Djilor", "Niodior", "Bassoul",
    ],

    "Gossas": [
        "Gossas Centre", "Colobane Gossas", "Ouadiour", "Patar Sine",
    ],

    # RÉGION DE MATAM
    "Matam": [
        "Matam Rive Gauche", "Ourossogui", "Waoundé", "Sinthiou Bamambé",
        "Gaé Matam", "Nguidilé", "Nabadji Civol", "Ogo", "Diamel", "Navel",
    ],

    "Kanel": [
        "Kanel Centre", "Sémé", "Orkadière Kanel", "Wouro Sidy",
        "Agnam Civol", "Orkadiéré", "Bokidiawé",
    ],

    "Ranérou-Ferlo": [
        "Ranérou Ferlo", "Vélingara Ranérou", "Lougré Thioly",
        "Vélingara Ferlo", "Soubalo", "Gourel Serigne",
    ],

    # RÉGION DE TAMBACOUNDA
    "Tambacounda": [
        "Dépôt", "Pont", "Gourel", "Quartiers proches de la gare",
        "Quartier Liberté", "Quartier Plateau", "Quartier Médina Coura",
        "Quinzambougou", "Abattoirs", "Saré Guilél", "Salikéné",
        "Diallobougou", "Sinthiang", "Saré Yoba", "Plateau Tambacounda",
    ],

    "Bakel": [
        "Bakel Centre", "Kidira", "Moudéry", "Gabou", "Kéniéba",
        "Diawara", "Ballou", "Yaféra",
    ],

    "Goudiry": [
        "Goudiry Centre", "Sinthiou Fissa", "Kouthiaba", "Bala",
    ],

    "Koumpentoum": [
        "Koumpentoum Centre", "Missirah Wadène", "Malem Niani",
        "Bamba Thialène", "Ndoga Babacar",
    ],

    # RÉGION DE KOLDA
    "Kolda": [
        "Doumassou", "Gadapara", "Quartiers en extension urbaine",
        "Quartier Fafacourou", "Quartier Sikilo", "Quartier Doumassou Nord",
        "Bouna Kane", "Hilèle", "Saré Kémo", "Ndiobène", "Médina Chérif",
        "Sinthiang Tamba", "Bagadadji", "Saré Yoro Bana", "Salikégné Kolda",
    ],

    "Vélingara": [
        "Vélingara Centre", "Linkéring", "Kounkané", "Paroumba",
        "Saré Coly Sallé", "Diaobé", "Bonconto",
    ],

    "Médina Yoro Foulah": [
        "Médina Yoro Foulah Centre", "Pata", "Niaming", "Bignarabé",
    ],

    # RÉGION DE KAFFRINE
    "Kaffrine": [
        "Gniby", "Katakel", "Diamagadio", "Quartier Médina Kaffrine",
        "Quartier Diamaguène", "Quartier Escale Kaffrine", "Kaffrine 2",
        "Ndiogou", "Toune Mosquée", "Nganda", "Sagna",
    ],

    "Birkelane": [
        "Birkelane Centre", "Kahi", "Mabo", "Touba Mosquée Birkelane",
    ],

    "Koungheul": [
        "Koungheul Centre", "Ida Mouride", "Ribot Escale", "Lour Escale",
        "Missirah Koungheul", "Passa",
    ],

    "Malem-Hodar": [
        "Malem Hodar Centre", "Kouthia Kayemor", "Ndième", "Saly Escale",
    ],

    # RÉGION DE SÉDHIOU
    "Sédhiou": [
        "Marsassoum", "Diendé", "Djibabouya", "Dianah Malary",
        "Quartier Sédhiou Escale", "Quartier Boudié",
        "Julescounda", "Moricounda", "Santhie", "Doumassou Sédhiou",
        "Simbandi Balante", "Tanaf", "Diattacounda", "Ouro Sogui", "Baghere",
    ],

    "Bounkiling": [
        "Bounkiling Centre", "Bounkiling Escale", "Djibanar", "Inor", "Ndiamalathiel",
    ],

    "Goudomp": [
        "Goudomp Centre", "Samine", "Kaour", "Djilacolon", "Diabougou",
    ],

    # RÉGION DE KÉDOUGOU
    "Kédougou": [
        "Saraya", "Bandafassi", "Quartier Dandé", "Quartier Fongolimbi",
        "Quartier Ethiolo", "Mosquée", "Lawol Tamba", "Gadior", "Dalaba",
        "Dimboli", "Dindefello", "Ninéfécha",
    ],

    "Salémata": [
        "Salemata Centre", "Khossanto", "Tomboronkoto", "Dakately",
    ],

    "Saraya": [
        "Saraya Centre", "Bembou", "Médina Baffe", "Sabodala Centre",
        "Missirah Sirimana", "Khéréba",
    ],

    # RÉGION DE KAOLACK
    "Kaolack": [
        "Médina Baye", "Léona", "Kasnack", "Ndangane", "Sam",
        "Quartier Central", "Escale Kaolack", "Sara", "Boustane",
        "Kassaville", "Thioffior", "Touba Kaolack", "Ndorong Kaolack",
    ],

    "Nioro du Rip": [
        "Nioro Centre", "Médina Sabakh", "Porokhane", "Keur Madiabel",
        "Kayemor", "Paoskoto Nioro", "Wack Ngouna",
    ],

    "Guinguinéo": [
        "Guinguinéo Centre", "Guinguinéo Kaolack", "Ngayène", "Paoskoto",
        "Ngathie Naoudé", "Keur Samba Guèye", "Fao",
        "Kahone Centre", "Gandiaye", "Ndoffane", "Sibassor", "Latmingué",
        "Keur Socé", "Mbadakhoune", "Ndiaffate", "Thiomby",
    ],
}