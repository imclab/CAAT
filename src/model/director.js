/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Director is the animator scene graph manager.
 * The director elements is an ActorContainer itself. It manages different Scenes.
 * It is responsible for:
 *  + scene changes.
 *  + route input to the appropriate scene graph actor.
 *  + be the central point for resource caching.
 *  + manage the timeline.
 *
 *
 * TODO:
 *  + add more scene change transitions (translations and flip)
 *  + expose more events. 
 *
 **/


(function() {
	CAAT.Director= function() {
		this.scenes= [];
		CAAT.Director.superclass.constructor.call(this);
	};

	extend( CAAT.Director, CAAT.ActorContainer, {

		scenes:			null,
		currentScene:	null,
        canvas:         null,
		crc:			null,	// canvas rendering context
        time:           0,
        domCanvas:      null,

        meIn:           null,
        meOut:          null,

        initialize : function(width,height) {

            var canvas= document.getElementById('s');
            canvas.width= 680;
            canvas.height=500;

            this.setBounds(0, 0, canvas.width, canvas.height);
            this.create();
            this.canvas= canvas;
            this.crc= canvas.getContext('2d');
            this.domCanvas= canvas;

            __GlobalEnableEvents(this);
        },
        render : function(time) {


			this.time= time;
			this.crc.globalAlpha=1;
            this.crc.globalCompositeOperation='source-over';
            this.crc.clearRect(0,0,this.width,this.height);
            
			this.crc.setTransform(1,0,0,1,0,0);
			
			for( var i=0; i<this.childList.length; i++ ) {
				if (this.childList[i].isInAnimationFrame(time)) {
					this.crc.save();
                    var scene_time= time-this.childList[i].start_time;
					this.childList[i].animate(this, scene_time);
                    this.childList[i].time= scene_time;
					this.crc.restore();
				}
			}
			
		},
		addScene : function( scene ) {
			scene.setBounds(0,0,this.width,this.height);
			this.scenes.push(scene);
			scene.setEaseListener(this);
		},
		getNumScenes : function() {
			return this.scenes.length;
		},
		easeInOut : function( inSceneIndex, typein, anchorin, outSceneIndex, typeout, anchorout, time, alpha, interpolatorIn, interpolatorOut ) {

            if ( inSceneIndex==this.getCurrentSceneIndex() ) {
                return;
            }

			var ssin=this.scenes[ inSceneIndex ];
			var sout=this.scenes[ outSceneIndex ];

            meIn=  ssin.mouseEnabled;
            meOut= sout.mouseEnabled;

            ssin.mouseEnabled= false;
            sout.mouseEnabled= false;

			ssin.setFrameTime(this.time, Number.MAX_VALUE);
			sout.setFrameTime(this.time, Number.MAX_VALUE);
			
			ssin.resetTransform();
			sout.resetTransform();

            ssin.setLocation(0,0);
            sout.setLocation(0,0);

            ssin.alpha = 1;
            sout.alpha = 1;
			
			if (typein==CAAT.Scene.prototype.EASE_ROTATION) {
				ssin.easeRotationIn(time, alpha, anchorin, interpolatorIn );
			} else if (typein==CAAT.Scene.prototype.EASE_SCALE) {
				ssin.easeScaleIn(0,time, alpha, anchorin, interpolatorIn );
			} else {
                ssin.easeTranslationIn(time,alpha,anchorin,interpolatorIn );
            }
			
			if (typeout==CAAT.Scene.prototype.EASE_ROTATION) {
				sout.easeRotationOut(time, alpha, anchorout, interpolatorOut );
			} else if (typeout==CAAT.Scene.prototype.EASE_SCALE) {
				sout.easeScaleOut(0,time, alpha, anchorout, interpolatorOut );
			} else {
                sout.easeTranslationOut(time,alpha,anchorout, interpolatorOut);
            }
			
			this.childList= [];

			this.addChild(sout);
			this.addChild(ssin);
		},
		easeInOutRandom : function(inIndex,outIndex,time,alpha) {

            var pin=Math.random();
            var pout=Math.random();

			if ( this.getBrowserName()=='Firefox' ) {
                var typeIn=  pin<.5  ? CAAT.Scene.prototype.EASE_ROTATION : CAAT.Scene.prototype.EASE_TRANSLATE;
                var typeOut= pout<.5 ? CAAT.Scene.prototype.EASE_ROTATION : CAAT.Scene.prototype.EASE_TRANSLATE;
				this.easeInOut( 
						inIndex, 
						typeIn,
						(Math.random()*8.99)>>0,
						
						outIndex, 
						typeOut,
						(Math.random()*8.99)>>0,
						
						time,
						alpha );
				
			} else {
                var typeIn;
                var interpolatorIn;

                if (pin<.33) {
                    typeIn= CAAT.Scene.prototype.EASE_ROTATION;
                    interpolatorIn= new CAAT.Interpolator().createExponentialInOutInterpolator(4);
                } else if (pin<.66) {
                    typeIn= CAAT.Scene.prototype.EASE_SCALE;
                    interpolatorIn= new CAAT.Interpolator().createElasticOutInterpolator(1.1, .4);
                } else {
                    typeIn= CAAT.Scene.prototype.EASE_TRANSLATE;
                    interpolatorIn= new CAAT.Interpolator().createBounceOutInterpolator();
                }

                var typeOut;
                var InterpolatorOut;

                if (pout<.33) {
                    typeOut= CAAT.Scene.prototype.EASE_ROTATION;
                    interpolatorOut= new CAAT.Interpolator().createExponentialInOutInterpolator(4);
                } else if (pout<.66) {
                    typeOut= CAAT.Scene.prototype.EASE_SCALE;
                    interpolatorOut= new CAAT.Interpolator().createExponentialOutInterpolator(4);
                } else {
                    typeOut= CAAT.Scene.prototype.EASE_TRANSLATE;
                    interpolatorOut= new CAAT.Interpolator().createBounceOutInterpolator();
                }

				this.easeInOut(
						inIndex, 
						typeIn,
						(Math.random()*8.99)>>0,
						
						outIndex, 
                        typeOut,
						(Math.random()*8.99)>>0,
						
						time,
						alpha,
                        
                        interpolatorIn,
                        interpolatorOut);
			}
		},
		easeIn : function( inSceneIndex, type, time, alpha, anchor, interpolator ) {
			var sin= this.scenes[ inSceneIndex ];
			if (type==CAAT.Scene.prototype.EASE_ROTATION) {
				sin.easeRotationIn(time, alpha, anchor, interpolator );
			} else if (type==CAAT.Scene.prototype.EASE_SCALE) {
				sin.easeScaleIn(0,time, alpha, anchor, interpolator );
			} else {
                sin.easeTranslationIn( time, alpha, anchor, interpolator );
            }
			this.childList= [];
			this.addChild(sin);

            meIn= sin.mouseEnabled;
            meOut= null;

            sin.mouseEnabled= false;

			sin.setFrameTime(this.time, Number.MAX_VALUE);
		},
		setScene : function( sceneIndex ) {
			var sin= this.scenes[ sceneIndex ];
			this.childList= [];
			this.addChild(sin);
			this.currentScene= sin;
			
			sin.setFrameTime(this.time, Number.MAX_VALUE);
		},
		switchToScene : function( iNewSceneIndex, time, alpha, transition ) {
			var currentSceneIndex= this.getSceneIndex(this.currentScene);
			
			if (!transition) {
				this.setScene(iNewSceneIndex);
			}
			else {
				this.easeInOutRandom( iNewSceneIndex, currentSceneIndex, time, alpha );
			}			
		},
		switchToPrevScene : function(time, alpha, transition) {
			
			var currentSceneIndex= this.getSceneIndex(this.currentScene);
			
			if ( this.getNumScenes()<=1 || currentSceneIndex==0 ) {
				return;
			}
			
			if (!transition) {
				this.setScene(currentSceneIndex-1);
			}
			else {
				this.easeInOutRandom( currentSceneIndex-1, currentSceneIndex, time, alpha );
			}
		},
		switchToNextScene: function(time, alpha, transition) {
			
			var currentSceneIndex= this.getSceneIndex(this.currentScene);
			
			if ( this.getNumScenes()<=1 || currentSceneIndex==this.getNumScenes()-1 ) {
				return;
			}

			if (!transition) {
				this.setScene(currentSceneIndex+1);
			}
			else {
				this.easeInOutRandom( currentSceneIndex+1, currentSceneIndex, time, alpha );
			}
		},
		mouseEnter : function(mouseEvent) {
		},
		mouseExit : function(mouseEvent) {
		},
		mouseMove : function(mouseEvent) {
		},
		mouseDown : function(mouseEvent) {
		},
		mouseUp : function(mouseEvent) {
		},
		mouseDrag : function(mouseEvent) {
		},
		/*
		 * Scene easing listener.
		 */
		easeEnd : function( scene, b_easeIn ) {
			// scene is going out
			if ( false==b_easeIn ) {
				scene.setExpired(true);
                scene.mouseEnabled= meOut;
			} else {
				this.currentScene= scene;
                this.currentScene.activated();
                this.currentScene.mouseEnabled= meIn;
			}
			
			scene.emptyBehaviourList();
		},
		getSceneIndex : function( scene ) {
			for( var i in this.scenes ) {
				if ( this.scenes[i]==scene ) {
					return i>>0;
				}
			}
			return -1;
		},
		getCurrentSceneIndex : function() {
			return this.getSceneIndex(this.currentScene);
		},
		getBrowserName : function() {
			return BrowserDetect.browser;
		},
		getBrowserVersion : function() {
			return BrowserDetect.version;
		},
		getOSName : function() {
			return BrowserDetect.OS;
		}

    });
})();

// TODO: ease in out flip. 
/*		flip : function( inSceneIndex, time ) {
			var ssin=this.scenes[ inSceneIndex ];
			var sout=null;

			this.childList= [];

			if ( this.currentScene!=null ) {
				sout= this.currentScene;
				this.scenes[ this.getSceneIndex(this.currentScene) ];
				sout.setFrameTime(this.time, Number.MAX_VALUE);
				sout.easeScaleOut(0, time/2, false, CAAT.Actor.prototype.ANCHOR_CENTER );
				this.addChild(sout);
			}

			ssin.setFrameTime(this.time/2, Number.MAX_VALUE);
			ssin.easeScaleIn( time/2, time/2, false, CAAT.Actor.prototype.ANCHOR_CENTER );
			this.addChild(ssin);
		},
		flipToNext : function( time ) {
			var currentSceneIndex= this.getSceneIndex(this.currentScene);

			if ( this.getNumScenes()<=1 || currentSceneIndex==this.getNumScenes()-1 ) {
				return;
			}

			this.flip( currentSceneIndex+1, time );
		},
		flipToPrev : function( time ) {
			var currentSceneIndex= this.getSceneIndex(this.currentScene);

			if ( this.getNumScenes()<=1 || currentSceneIndex==0 ) {
				return;
			}

			this.flip( currentSceneIndex-1, time );
		},*/