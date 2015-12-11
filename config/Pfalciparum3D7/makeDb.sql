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
"/srv/epgg/data/data/subtleKnife/Pfalciparum3D7/",
"/srv/epgg/data/data/subtleKnife/seq/Pfalciparum3D7.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{}",
"chr1,256704,chr1,310867",
"gene",
"chr1,chr2,chr3,chr4,chr5,chr6,chr7,chr8,chr9,chr10,chr11,chr12,chr13,chr14,chrA,chrM",
true,
true,
"pfa",
"Assembly version|Pfalciparum3D7|Sequence source|<a href=http://noble.gs.washington.edu/proj/plasmo3d/ target=_blank>plasmo3d</a>|Date parsed|December 10, 2015|Chromosomes|16|Misc|0|Total bases|23,332,831|Logo art|<a href=https://en.wikipedia.org/wiki/Plasmodium_falciparum#/media/File:Plasmodium_falciparum_01.png target=_blank>link</a>",
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

