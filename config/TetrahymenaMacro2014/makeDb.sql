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
"/srv/epgg/data/data/subtleKnife/TetrahymenaMacro2014/",
"/srv/epgg/data/data/subtleKnife/seq/TetrahymenaMacro2014.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{}",
"scf_8254667,1016158,scf_8254667,1216158",
"gene",
"scf_8254803,scf_8254667,scf_8254697,scf_8254659,scf_8254752,scf_8254811,scf_8254650,scf_8254470,scf_8254716,scf_8254431,scf_8254645,scf_8254582,scf_8254747,scf_8254545,scf_8254776,scf_8254798,scf_8254638,scf_8254617,scf_8254815,scf_8254564,scf_8254665,scf_8254373,scf_8254719,scf_8254406,scf_8254590,scf_8254788,scf_8254649,scf_8254600,scf_8254814,scf_8254594",
true,
true,
null,
"Assembly version|TetrahymenaMacro2014|Sequence source|<a href=http://ciliate.org/index.php/home/downloads target=_blank>TGD</a>|Date parsed|December 15, 2016|Chromosomes|0|Misc|1,158|Total bases|103,014,375|Logo art|<a href=http://faculty.jsd.claremont.edu/ewiley/images/tetpic1.jpg target=_blank>link</a>",
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

