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
"/srv/epgg/data/data/subtleKnife/TetrahymenaMicro2014/",
"/srv/epgg/data/data/subtleKnife/seq/TetrahymenaMicro2014.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{}",
"Supercontig2.1,2636516,Supercontig2.1,2844833",
"gene",
"Supercontig2.1,Supercontig2.2,Supercontig2.3,Supercontig2.4,Supercontig2.5,Supercontig2.6,Supercontig2.7,Supercontig2.8,Supercontig2.9,Supercontig2.10,Supercontig2.11,Supercontig2.12,Supercontig2.13,Supercontig2.14,Supercontig2.15,Supercontig2.16,Supercontig2.17,Supercontig2.18,Supercontig2.19,Supercontig2.20,Supercontig2.21,Supercontig2.22,Supercontig2.23,Supercontig2.24,Supercontig2.25",
true,
true,
null,
"Assembly version|TetrahymenaMicro2014|Sequence source|<a href=http://ciliate.org/index.php/home/downloads target=_blank>TGD</a>|Date parsed|December 15, 2016|Chromosomes|0|Misc|949|Total bases|156,225,922|Logo art|<a href=http://faculty.jsd.claremont.edu/ewiley/images/tetpic1.jpg target=_blank>link</a>",
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

