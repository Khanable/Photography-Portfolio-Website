import { ElouiseWebsitePage } from './app.po';

describe('elouise-website App', () => {
  let page: ElouiseWebsitePage;

  beforeEach(() => {
    page = new ElouiseWebsitePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
