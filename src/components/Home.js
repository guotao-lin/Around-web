import React from 'react';
import $ from 'jquery';
import { Tabs, Spin } from 'antd';
import { GEO_OPTIONS, POS_KEY, AUTH_PREFIX, TOKEN_KEY, API_ROOT } from '../constants';
import { Gallery } from './Gallery';
import { CreatePostButton } from './CreatePostButton';
import { WrappedAroundMap } from './AroundMap';


export class Home extends React.Component {
    state = {
      posts: [],
      error: '',
      loadingGeoLocation: false,
      loadingPosts: false,
    }

    componentDidMount() {
        if ("geolocation" in navigator) {
          this.setState({ loadingGeoLocation: true });
          navigator.geolocation.getCurrentPosition(
            this.onSuccessLoadGeoLocation,
            this.onFailedLoadGeoLocation,
            GEO_OPTIONS,
          );
        } else {
          this.setState({ error: "Your browser does not support geolocation."});
        }
    }

    onSuccessLoadGeoLocation = (position) => {
      console.log(position);
      this.setState({ loadingGeoLocation: false, error: '' });
      const {latitude: lat, longitude: lon} = position.coords;
      localStorage.setItem(POS_KEY, JSON.stringify({ lat: lat, lon: lon }));
      this.loadNearbyPosts();
    }

    onFailedLoadGeoLocation = () => {
      this.setState({ loadingGeoLocation: false, error: 'Failed to load geolocation.'});
    }

    getGalleryPanelContent = () => {
      if (this.state.error) {
        return <div>{this.state.error}</div>;
      } else if (this.state.loadingGeoLocation) {
        return <Spin tip="Loading geo location ..."/>;
      } else if (this.state.loadingPosts) {
        return <Spin tip='Loading posts ...'/>;
      } else if (this.state.posts) {
        const images = this.state.posts.map((post) => {
          return {
           user: post.user,
           src: post.url,
           thumbnail: post.url,
           thumbnailWidth: 400,
           thumbnailHeight: 300,
           caption: post.message,
         };
        });

        return (
          <Gallery
            images={images}
          />
        );
      }
      return null;
    }

    loadNearbyPosts = () => {
      //const { lat, lon } = { "lat":37.5629917,"lon":-122.32552539999998 };
      const { lat, lon } = JSON.parse(localStorage.getItem(POS_KEY));
      this.setState({ loadingPosts: true });
      return $.ajax({
           url: `${API_ROOT}/search?lat=${lat}&lon=${lon}&range=20`,
           method: 'GET',
           headers: {
             Authorization: `${AUTH_PREFIX} ${localStorage.getItem(TOKEN_KEY)}`,
           },
      }).then((response) => {
        this.setState({ loadingPosts: false, posts: response, error: '' });
        console.log(response);
      }, (error) => {
        this.setState({ loadingPosts: false, error: error.responseText });
      }).catch((error) => {
        this.setState({ error: error });
      });
    }

    render() {
        const TabPane = Tabs.TabPane;
        const createPostButton = <CreatePostButton loadNearbyPosts={this.loadNearbyPosts} />;
        return (
            <Tabs tabBarExtraContent={createPostButton} className="main-tabs">
                <TabPane tab="Posts" key="1">
                    {this.getGalleryPanelContent()}
                </TabPane>
                <TabPane tab="Map" key="2">
                    <WrappedAroundMap
                      posts={this.state.posts}
                      googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyC4R6AN7SmujjPUIGKdyao2Kqitzr1kiRg&v=3.exp&libraries=geometry,drawing,places"
                      loadingElement={<div style={{ height: `100%` }} />}
                      containerElement={<div style={{ height: `400px` }} />}
                      mapElement={<div style={{ height: `100%` }} />}
                    />
                </TabPane>
            </Tabs>
        );
    }
}
