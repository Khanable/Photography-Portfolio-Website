import { NavGraph, NavNode, Dir } from './nav.js';
import { PhotoNode } from './photoNode.js';
import { CategoryNode } from './categoryNode.js';
import * as AboutHtml from './about.html';
import * as IndexHtml from './index.html';
import * as ContactHtml from './contact.html';
import * as CVHtml from './cv.html';

const Location = {
	Index: 0,
	About: 1,
	Contact: 2,
	CV: 3,
	Category1: 4,
	Photo1: 5,
}

const IndexNode = new NavNode(Location.Index, IndexHtml, 'index');
const AboutNode = new NavNode(Location.About, AboutHtml, 'about');
const ContactNode = new NavNode(Location.Contact, ContactHtml, 'contact');
const CVNode = new NavNode(Location.CV, CVHtml, 'cv');
const Category1 = new CategoryNode(Location.Category1, 'category1', '/static/testImage.jpg', '/static/testImage.jpg', '/static/testImage.jpg', '/static/testImage.jpg');
const Photo1 = new PhotoNode(Location.Photo1, 'photo1', '/static/testImage.jpg');


export const Graph = new NavGraph(IndexNode);
IndexNode.addConnection(Dir.West, AboutNode, 'About', 'Index');
IndexNode.addConnection(Dir.East, ContactNode, 'Contact', 'Index');
IndexNode.addConnection(Dir.South, Category1, 'Gallery', 'Index');

AboutNode.addConnection(Dir.West, CVNode, 'CV', 'About');

Photo1.addConnection(Dir.North, Category1, 'Category1', 'Photo1');
