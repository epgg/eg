/* for run-time use of gene set view */
drop table if exists genesetRuntime;
create table genesetRuntime (
  session char(20) not null collate utf8_bin,
  statusId int not null,
  itemlist MEDIUMTEXT not null
);
/* scaffold, for run-time */
drop table if exists scaffoldRuntime;
create table scaffoldRuntime (
  session char(20) not null collate utf8_bin,
  statusId int not null,
  count smallint unsigned not null,
  names longtext not null /* name1,len1,name2,len2,... */
);
