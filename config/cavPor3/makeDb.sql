drop table if exists config;
create table config (
  bbiPath text not null,
  seqPath text null,
  defaultGenelist text not null,
  defaultCustomtracks text not null,
  defaultPosition varchar(255) not null,
  defaultDecor text null,
  defaultScaffold text not null,
  hasGene boolean not null,
  allowJuxtaposition boolean not null,
  keggSpeciesCode varchar(255) null,
  information text not null,
  runmode tinyint not null,
  initmatplot boolean not null
);
insert into config values(
"/srv/epgg/data/data/subtleKnife/cavPor3/",
"/srv/epgg/data/data/subtleKnife/seq/cavPor3.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{}",
"scaffold_44,3822956,scaffold_44,3871974",
"refGene,xenoRefGene,rmsk_all",
"scaffold_0,scaffold_1,scaffold_2,scaffold_3,scaffold_5,scaffold_4,scaffold_6,scaffold_7,scaffold_8,scaffold_9,scaffold_11,scaffold_10,scaffold_12,scaffold_13,scaffold_14,scaffold_15,scaffold_16,scaffold_17,scaffold_18,scaffold_19,scaffold_20,scaffold_21,scaffold_22,scaffold_24,scaffold_23,scaffold_26,scaffold_25,scaffold_27,scaffold_28,scaffold_29,scaffold_30,scaffold_32,scaffold_31,scaffold_33,scaffold_34,scaffold_35,scaffold_36,scaffold_37,scaffold_38,scaffold_39,scaffold_40,scaffold_41,scaffold_42,scaffold_44,scaffold_43,scaffold_45,scaffold_46,scaffold_47,scaffold_48,scaffold_49,scaffold_50,scaffold_52,scaffold_51,scaffold_53,scaffold_54,scaffold_55,scaffold_56,scaffold_57,scaffold_58,scaffold_59,scaffold_60,scaffold_61,scaffold_62,scaffold_63,scaffold_64,scaffold_65,scaffold_66,scaffold_67,scaffold_68,scaffold_69,scaffold_70,scaffold_71,scaffold_72,scaffold_73,scaffold_78,scaffold_74,scaffold_77,scaffold_75,scaffold_76,scaffold_79,scaffold_80,scaffold_81,scaffold_82,scaffold_83,scaffold_84,scaffold_86,scaffold_85,scaffold_87,scaffold_88,scaffold_89,scaffold_91,scaffold_90,scaffold_93,scaffold_92,scaffold_94,scaffold_97,scaffold_95,scaffold_96,scaffold_98,scaffold_100",
true,
true,
\N,
"Assembly version|cavPor3|Sequence source|<a href=http://hgdownload.soe.ucsc.edu/goldenPath/cavPor3/bigZips/ target=_blank>UCSC Genome Browser</a>|Date parsed|March 7, 2013|Scaffolds|3144|Logo art|<a href=http://en.wikipedia.org/wiki/File:Two_adult_Guinea_Pigs_(Cavia_porcellus).jpg target=_blank>link</a>",
0,
false
);


drop table if exists tempURL;
create table tempURL (
  session varchar(100) not null,
  offset INT unsigned not null,
  urlpiece text not null
);


drop table if exists scaffoldInfo;
create table scaffoldInfo (
  parent varchar(255) not null,
  child varchar(255) not null,
  childLength int unsigned not null
);
load data local infile "scaffoldInfo" into table scaffoldInfo;
